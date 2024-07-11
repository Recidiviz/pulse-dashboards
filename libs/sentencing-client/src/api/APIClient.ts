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
import { runInAction, when } from "mobx";
import superjson from "superjson";

// Don't import this via type alias, otherwise it will make the whole app a dependency
// rather than just the types
import type { AppRouter } from "~sentencing-server-types/shared/types";

import { MutableCaseAttributes } from "../components/CaseDetails/types";
import { PSIStore } from "../datastores/PSIStore";

export type tRPCClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

export type Staff = Awaited<
  ReturnType<tRPCClient["staff"]["getStaff"]["query"]>
>;

export type Case = Awaited<ReturnType<tRPCClient["case"]["getCase"]["query"]>>;

export type Client = Staff["Cases"][number]["Client"];

export type CaseWithClient = Case & { Client: Client };

export class APIClient {
  client?: tRPCClient;

  constructor(public readonly psiStore: PSIStore) {
    when(
      () => !!this.psiStore.rootStore.userStore.getToken,
      async () => {
        const client = await this.initTRPCClient();
        runInAction(() => {
          this.client = client;
        });
      },
    );
  }

  get baseUrl(): string {
    return import.meta.env["VITE_SENTENCING_API_URL"];
  }

  get trpcClient() {
    return this.client;
  }

  async initTRPCClient(): Promise<tRPCClient> {
    if (this.client) return this.client;
    const requestHeaders = await this.getRequestHeaders();

    return createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: this.baseUrl,
          async headers() {
            return requestHeaders;
          },
        }),
      ],
      // Required to get Date objects to serialize correctly.
      transformer: superjson,
    });
  }

  async getRequestHeaders(): Promise<{ [key: string]: string }> {
    const userStore = this.psiStore.rootStore.userStore;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const token = await userStore.getToken!();

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getStaffInfo(): Promise<Staff> {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });
    if (!this.psiStore.staffPseudoId)
      return Promise.reject({ message: "No staff pseudo id found" });

    const fetchedData = await this.trpcClient.staff.getStaff.query({
      pseudonymizedId: this.psiStore.staffPseudoId,
    });
    return fetchedData;
  }

  async setIsFirstLogin(pseudonymizedId: string) {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });
    return await this.trpcClient.staff.updateStaff.mutate({
      pseudonymizedId,
      hasLoggedIn: true,
    });
  }

  async getCaseDetails(caseId: string): Promise<Case> {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    const fetchedData = await this.trpcClient.case.getCase.query({
      id: caseId,
    });
    return fetchedData;
  }

  async updateCaseDetails(caseId: string, updates: MutableCaseAttributes) {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    return await this.trpcClient.case.updateCase.mutate({
      id: caseId,
      attributes: updates,
    });
  }
}
