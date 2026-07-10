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

import { makeAutoObservable, runInAction } from "mobx";

import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import UserStore from "./UserStore";

export type CollectionSummary = {
  name: string;
  numDocuments: number;
  numFields: number;
  defaultSortingField?: string;
  createdAt?: number;
};

export type CollectionField = {
  name: string;
  type: string;
  facet?: boolean;
  optional?: boolean;
  index?: boolean;
  sort?: boolean;
  infix?: boolean;
};

export type CollectionSchema = {
  name: string;
  fields: CollectionField[];
  num_documents: number;
  default_sorting_field?: string;
  enable_nested_fields?: boolean;
  created_at?: number;
};

/** Thrown when a Typesense API request fails. */
export class TypesenseFetchError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export class TypesenseStore implements Hydratable {
  host?: string;
  collectionsSummary?: CollectionSummary[];
  collectionsSchema?: Record<string, CollectionSchema>;
  checkedAt?: Date;

  private hydrator: HydratesFromSource;

  constructor(private userStore: UserStore) {
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.checkedAt === undefined)
            throw new Error("health not populated");
        },
        () => {
          if (this.collectionsSummary === undefined)
            throw new Error("collections summary not populated");
        },
        () => {
          if (this.collectionsSchema === undefined)
            throw new Error("collections schema not populated");
        },
      ],
      populate: async () => {
        await this.fetchHealth();
        await this.fetchCollectionsSummary();
        await this.fetchCollectionsSchema();
      },
    });

    makeAutoObservable(this);
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  refresh(): void {
    this.host = undefined;
    this.collectionsSummary = undefined;
    this.collectionsSchema = undefined;
    this.checkedAt = undefined;
    this.hydrator.setHydrationStateOverride({ status: "needs hydration" });
    void this.hydrate();
  }

  /** Shared base path for all Typesense API endpoints. */
  private get baseUrl(): string {
    return `${import.meta.env.VITE_API_URL}/api/typesense`;
  }

  /** Fetches the current user's token and returns the Authorization header. */
  private async authHeaders(): Promise<{ Authorization: string }> {
    const token = (await this.userStore.getToken?.()) as string | undefined;
    return { Authorization: `Bearer ${token ?? ""}` };
  }

  /**
   * See apps/staff-server/src/server/typesense/typesenseManagement.js
   * GET /api/typesense/health
   */
  private async fetchHealth(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/health`, {
      headers: await this.authHeaders(),
    });
    const body = await res.json();
    runInAction(() => {
      this.checkedAt = new Date();
      if ("host" in body) {
        this.host = (body.host as string | null | undefined) ?? undefined;
      }
    });
    if (!res.ok) {
      throw new TypesenseFetchError(
        body.errors?.[0] ?? `HTTP ${res.status}`,
        "GET /health",
        res.status,
      );
    }
  }

  /**
   * See apps/staff-server/src/server/typesense/typesenseManagement.js
   * GET /api/typesense/collections
   */
  private async fetchCollectionsSummary(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/collections`, {
      headers: await this.authHeaders(),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new TypesenseFetchError(
        body.errors?.[0] ?? `HTTP ${res.status}`,
        "GET /collections",
        res.status,
      );
    }
    runInAction(() => {
      this.collectionsSummary = body as CollectionSummary[];
    });
  }

  /**
   * See apps/staff-server/src/server/typesense/typesenseManagement.js
   * GET /api/typesense/schemas
   */
  private async fetchCollectionsSchema(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/schemas`, {
      headers: await this.authHeaders(),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new TypesenseFetchError(
        body.errors?.[0] ?? `HTTP ${res.status}`,
        "GET /schemas",
        res.status,
      );
    }
    runInAction(() => {
      this.collectionsSchema = body as Record<string, CollectionSchema>;
    });
  }
}
