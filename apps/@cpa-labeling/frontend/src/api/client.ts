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

import type {
  FeedbackListItem,
  FeedbackSubmission,
  LabelingFeedback,
  LabelingStats,
  PaginatedResponse,
  RecordDetail,
  RecordListItem,
} from "../types";

// The frontend and backend are served from the same origin in production
// In development, the Vite proxy handles /api -> localhost:8080
// VITE_API_URL can optionally override the backend URL if needed
const BACKEND_URL = import.meta.env.VITE_API_URL || "/api";
const API_BASE = `${BACKEND_URL}/labeling`;

// Token getter function type
type GetToken = () => Promise<string>;

// Store the token getter globally so it can be set by App.tsx
let getAuthToken: GetToken | null = null;

export function setAuthTokenGetter(getter: GetToken | null) {
  getAuthToken = getter;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  // Add auth token if available
  if (getAuthToken) {
    try {
      const token = await getAuthToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.error("Failed to get auth token:", err);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function listRecords(
  page = 1,
  size = 20,
  options?: {
    status?: string;
    evaluator?: string;
    unlabeled_only?: boolean;
  },
): Promise<PaginatedResponse<RecordListItem>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (options?.status) params.set("status", options.status);
  if (options?.evaluator) params.set("evaluator", options.evaluator);
  if (options?.unlabeled_only) params.set("unlabeled_only", "true");

  return fetchJson(`${API_BASE}/records?${params}`);
}

export async function getRecordDetail(
  intakeId: string,
  evaluator?: string,
): Promise<RecordDetail> {
  const params = new URLSearchParams();
  if (evaluator) params.set("evaluator", evaluator);

  const queryString = params.toString();
  const url = `${API_BASE}/records/${intakeId}${queryString ? `?${queryString}` : ""}`;

  return fetchJson(url);
}

export async function submitFeedback(
  submission: FeedbackSubmission,
): Promise<LabelingFeedback> {
  return fetchJson(`${API_BASE}/feedback`, {
    method: "POST",
    body: JSON.stringify(submission),
  });
}

export async function getFeedback(
  intakeId: string,
  evaluator?: string,
): Promise<LabelingFeedback[]> {
  const params = new URLSearchParams();
  if (evaluator) params.set("evaluator", evaluator);

  const queryString = params.toString();
  const url = `${API_BASE}/feedback/${intakeId}${queryString ? `?${queryString}` : ""}`;

  return fetchJson(url);
}

export async function getStats(): Promise<LabelingStats> {
  return fetchJson(`${API_BASE}/stats`);
}

export async function getAllFeedback(
  page = 1,
  size = 20,
  options?: {
    evaluator?: string;
    has_issues?: boolean;
    intake_id?: string;
  },
): Promise<PaginatedResponse<FeedbackListItem>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (options?.evaluator) params.set("evaluator", options.evaluator);
  if (options?.has_issues !== undefined)
    params.set("has_issues", options.has_issues.toString());
  if (options?.intake_id) params.set("intake_id", options.intake_id);

  return fetchJson(`${API_BASE}/feedback/all?${params}`);
}
