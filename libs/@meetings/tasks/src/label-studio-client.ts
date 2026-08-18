// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { GoogleAuth } from "google-auth-library";

// =============================================================================
// Label Studio REST API client
//
// Our Label Studio instance sits behind Google IAP, so every request has to
// clear two independent auth layers, each with its own token on its own
// header:
//
// 1. IAP (Google): IAP won't let a request through to Label Studio at all
//    without a Google-signed ID token, minted for IAP's own OAuth audience,
//    on `Proxy-Authorization`. A user's own gcloud/OAuth credentials can't
//    mint an ID token for an arbitrary audience — Google's token endpoint
//    only issues those for service accounts — so we mint it from a service
//    account keyfile instead (see `createLabelStudioClientFromEnv`).
//
// 2. Label Studio (app-level, JWT): once past IAP, Label Studio has its own
//    separate JWT auth — a short-lived access token on `Authorization:
//    Bearer`. Per https://labelstud.io/guide/access_tokens, that access
//    token is obtained (and re-obtained on expiry) by POSTing a long-lived
//    *refresh* token to `/api/token/refresh/`; the refresh token itself is
//    never sent as a bearer token. `LABEL_STUDIO_API_TOKEN` here is that
//    refresh token — a legacy/access token in its place fails differently
//    (LS responds with a `Token is invalid`/`blacklisted`-style error, not
//    an IAP-level rejection).
// =============================================================================

/** One entry in an annotation's `result[]` array. */
export interface LabelStudioResult {
  from_name: string;
  type: string;
  value: { choices?: string[]; text?: string[] };
}

/** A Label Studio task as returned by the list/detail endpoints. */
export interface LabelStudioTask {
  id: number;
  data: Record<string, unknown>;
  /**
   * How many *completed* annotations the task has: Label Studio excludes ones
   * a rater skipped from this count, tallying those separately (a task with
   * only a skip reports `total_annotations: 0`, and
   * `/api/tasks/<id>/annotations/` returns nothing for it). Only present when
   * the task was listed with `withAnnotationCounts` — the default `task_only`
   * listing omits it.
   */
  total_annotations?: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export class LabelStudioClient {
  private accessToken: string | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly refreshToken: string,
    private readonly auth: GoogleAuth,
    private readonly iapAudience: string,
  ) {}

  /** Mint a fresh IAP ID token (layer 1) — these are short-lived, so re-minted per request. */
  private async iapIdToken(): Promise<string> {
    const client = await this.auth.getIdTokenClient(this.iapAudience);
    const headers = await client.getRequestHeaders();
    const entry = Object.entries(headers).find(
      ([k]) => k.toLowerCase() === "authorization",
    );
    if (!entry?.[1]) throw new Error("Failed to mint IAP ID token");
    return entry[1];
  }

  /**
   * Exchange the long-lived refresh token for a short-lived Label Studio
   * access token (layer 2) via `POST /api/token/refresh/` — still has to
   * pass IAP (layer 1) first, hence the `Proxy-Authorization` header here too.
   */
  private async refreshAccessToken(): Promise<string> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/api/token/refresh/`;
    const iapAuth = await this.iapIdToken();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Proxy-Authorization": iapAuth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: this.refreshToken }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Label Studio POST /api/token/refresh/ failed (${res.status}): ${body.slice(0, 500)}`,
      );
    }
    const json = (await res.json()) as { access: string };
    if (!json.access) {
      throw new Error(
        "Label Studio /api/token/refresh/ returned no access token",
      );
    }
    return json.access;
  }

  /** Issue a request carrying both auth layers, refreshing the LS access token once on a 401. */
  private async request<T>(
    path: string,
    init: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    if (!this.accessToken) {
      this.accessToken = await this.refreshAccessToken();
    }
    const iapAuth = await this.iapIdToken();
    const res = await fetch(url, {
      ...init,
      headers: {
        "Proxy-Authorization": iapAuth,
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 401 && !isRetry) {
      this.accessToken = null;
      return this.request<T>(path, init, true);
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Label Studio ${init.method ?? "GET"} ${path} failed (${res.status}): ${body.slice(0, 500)}`,
      );
    }
    // Some endpoints (e.g. PATCH with no content) return an empty body.
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async listUsers(): Promise<{ id: number; email: string }[]> {
    const users = await this.request<
      | { id: number; email: string }[]
      | { results: { id: number; email: string }[] }
    >("/api/users/");
    return Array.isArray(users) ? users : users.results;
  }

  /**
   * List a project's tasks.
   *
   * `withAnnotationCounts` swaps the `task_only` field set for the full one,
   * which is how the list endpoint populates `total_annotations` — needed to
   * tell an already-graded task from an untouched one without a per-task
   * annotations request.
   */
  async listTasksForProject(
    projectId: number,
    { withAnnotationCounts = false }: { withAnnotationCounts?: boolean } = {},
  ): Promise<LabelStudioTask[]> {
    const tasks: LabelStudioTask[] = [];
    const pageSize = 100;
    let page = 1;
    let fetched: number;
    do {
      // eslint-disable-next-line no-await-in-loop
      const res = await this.request<{ tasks: LabelStudioTask[] }>(
        `/api/tasks?project=${projectId}&page=${page}&page_size=${pageSize}&fields=${withAnnotationCounts ? "all" : "task_only"}`,
      );
      tasks.push(...res.tasks);
      fetched = res.tasks.length;
      page += 1;
    } while (fetched === pageSize);
    return tasks;
  }

  async listAnnotationsForTask(taskId: number): Promise<
    {
      id: number;
      completed_by: number;
      result: LabelStudioResult[];
      created_at: string;
      lead_time: number | null;
      was_cancelled: boolean;
      ground_truth: boolean;
    }[]
  > {
    return this.request(`/api/tasks/${taskId}/annotations/`);
  }

  /**
   * List GCS export ("target") storages configured for a project — the
   * *outbound* side, distinct from the GCS import ("source") storage the
   * rest of this client's methods deal with. A project can have any number
   * configured (including zero, e.g. staging currently has none); each
   * exports annotations to `<bucket>/<prefix>/<annotation_id>` on manual
   * "Sync Storage" clicks in the Label Studio UI, one JSON file per
   * annotation, embedding a full snapshot of the annotation and its task's
   * data as of the sync. There's no API trigger for this sync (it's UI-only)
   * and no built-in dedup — an annotation that's already been exported,
   * then recreated under a new id (e.g. via `createAnnotation`, migrating it
   * to a different task), gets exported *again* under the new id on the next
   * sync, leaving the original file behind as an orphan referencing a
   * since-deleted task. See `dedupe-label-studio-tasks.ts` for the cleanup.
   */
  async listExportStorages(
    projectId: number,
  ): Promise<{ id: number; bucket: string; prefix: string }[]> {
    return this.request(`/api/storages/export/gcs?project=${projectId}`);
  }

  /**
   * Overwrite a task's `data` blob. Label Studio replaces `data` wholesale
   * (it does not deep-merge), so callers must pass the complete object,
   * typically `{ ...existingData, newField: ... }`. Annotations are stored
   * separately and are left untouched.
   */
  async updateTaskData(
    taskId: number,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.request(`/api/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ data }),
    });
  }

  /** Delete a task. Its annotations are deleted along with it. */
  async deleteTask(taskId: number): Promise<void> {
    await this.request(`/api/tasks/${taskId}/`, { method: "DELETE" });
  }

  /**
   * Create a new annotation on a task — used to migrate an annotation from
   * one task to another (e.g. when deduping tasks that point at the same
   * meeting). Every field here was confirmed against the staging instance
   * (2026-08-06) to persist as given, rather than being overridden by the
   * server: `completedBy` (attribution — distinct from the requesting
   * service account's own identity), `leadTime`, `wasCancelled`, and
   * `groundTruth`. `created_at`/`updated_at` are *not* preservable this way
   * — Label Studio always stamps those to the time of this call, regardless
   * of what's sent — so a migrated annotation will show today's date, not
   * the original completion date.
   */
  async createAnnotation(
    taskId: number,
    {
      result,
      completedBy,
      leadTime,
      wasCancelled,
      groundTruth,
    }: {
      result: LabelStudioResult[];
      completedBy?: number;
      leadTime?: number | null;
      wasCancelled?: boolean;
      groundTruth?: boolean;
    },
  ): Promise<{
    id: number;
    completed_by: number;
    result: LabelStudioResult[];
  }> {
    return this.request(`/api/tasks/${taskId}/annotations/`, {
      method: "POST",
      body: JSON.stringify({
        result,
        ...(completedBy !== undefined && { completed_by: completedBy }),
        ...(leadTime !== undefined && { lead_time: leadTime }),
        ...(wasCancelled !== undefined && { was_cancelled: wasCancelled }),
        ...(groundTruth !== undefined && { ground_truth: groundTruth }),
      }),
    });
  }
}

/**
 * Build a {@link LabelStudioClient} from the standard `LABEL_STUDIO_*` env
 * vars plus `SA_KEY_FILE`.
 *
 * IAP requires an ID token minted for its OAuth audience. User credentials
 * can't mint one (Google's token endpoint won't issue an ID token for an
 * arbitrary audience to a user account — IAP rejects it as "empty token"), so
 * this uses a service-account keyfile.
 */
export function createLabelStudioClientFromEnv(): LabelStudioClient {
  const baseUrl = requireEnv("LABEL_STUDIO_URL");
  const refreshToken = requireEnv("LABEL_STUDIO_API_TOKEN");
  const iapAudience = requireEnv("LABEL_STUDIO_IAP_AUDIENCE");
  const saKeyFile = requireEnv("SA_KEY_FILE");
  const iapAuth = new GoogleAuth({ keyFile: saKeyFile });
  return new LabelStudioClient(baseUrl, refreshToken, iapAuth, iapAudience);
}
