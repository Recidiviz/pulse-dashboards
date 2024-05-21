// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { when } from "mobx";

// eslint-disable-next-line @nx/enforce-module-boundaries
import type { AppRouter } from "~sentencing-server/trpc/router";

import { PSIStore } from "../datastores/PSIStore";

export type tRPCClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

export type Staff = Awaited<ReturnType<tRPCClient["getStaff"]["query"]>>;

export type Case = Awaited<ReturnType<tRPCClient["getCase"]["query"]>>;

export class APIClient {
  client: tRPCClient;

  constructor(public readonly psiStore: PSIStore) {
    this.client = this.initTRPCClient();
  }

  private get baseUrl(): string {
    return "http://localhost:3002";
  }

  async getRequestHeaders(): Promise<{ [key: string]: string }> {
    const userStore = this.psiStore.rootStore.userStore;
    await when(() => !!userStore.getToken);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const token = await userStore.getToken!();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  initTRPCClient(): tRPCClient {
    if (this.client) return this.client;
    const requestHeaders = this.getRequestHeaders();
    return createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: this.baseUrl,
          async headers() {
            return {
              authorization: JSON.stringify(requestHeaders),
            };
          },
        }),
      ],
    });
  }

  async getStaffInfo(): Promise<Staff> {
    if (!this.psiStore.staffPseudoId)
      return Promise.reject({ message: "No staff pseudo id found" });

    const fetchedData = await this.client.getStaff.query({
      externalId: this.psiStore.staffPseudoId,
    });
    return fetchedData;
  }

  async getCaseDetails(caseId: string): Promise<Case> {
    const fetchedData = await this.client.getCase.query({ externalId: caseId });
    return fetchedData;
  }
}
