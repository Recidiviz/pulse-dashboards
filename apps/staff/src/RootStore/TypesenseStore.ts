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

import { castToError } from "~hydration-utils";

import UserStore from "./UserStore";

export type TypesenseHealthStatus = "pending" | "success" | "error";

export type HealthState = {
  status: TypesenseHealthStatus;
  error?: Error;
  checkedAt?: Date;
  isFetching: boolean;
  host?: string;
};

export class TypesenseStore {
  health: HealthState = {
    status: "pending",
    error: undefined,
    checkedAt: undefined,
    isFetching: false,
    host: undefined,
  };

  constructor(private userStore: UserStore) {
    makeAutoObservable(this);
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
   * See libs/staff-shared-server/src/server/typesense/typesenseManagement.js
   * for Typesense server endpoints.
   */
  async fetchHealth(): Promise<void> {
    if (this.health.isFetching) return;
    this.health.isFetching = true;
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        headers: await this.authHeaders(),
      });
      const body = await res.json();
      if (!res.ok) {
        const status = res.status;
        throw Object.assign(new Error(body.errors?.[0] ?? `HTTP ${status}`), {
          status,
        });
      }
      runInAction(() => {
        this.health.status = "success";
        this.health.error = undefined;
        this.health.isFetching = false;
        this.health.checkedAt = new Date();
        this.health.host = body.host ?? undefined;
      });
    } catch (e) {
      runInAction(() => {
        this.health.status = "error";
        const error = castToError(e);
        this.health.error = error;
        this.health.isFetching = false;
        this.health.checkedAt = new Date();
      });
    }
  }

  refreshHealth(): void {
    void this.fetchHealth();
  }
}
