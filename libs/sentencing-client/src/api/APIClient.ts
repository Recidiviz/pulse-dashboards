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

import {
  CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import { runInAction, when } from "mobx";
import superjson from "superjson";

import type { AppRouter } from "~sentencing-server-types/shared/types";

import { FormAttributes } from "../components/CaseDetails/types";
import { PSIStore } from "../datastores/PSIStore";

export type tRPCClient = CreateTRPCProxyClient<AppRouter>;

export type Staff = Awaited<ReturnType<APIClient["getStaffInfo"]>>;

export type StaffCases = Staff["Cases"];

export type StaffCase = StaffCases[number];

export type Case = Awaited<ReturnType<APIClient["getCaseDetails"]>>;

export type Insight = NonNullable<Case["insight"]>;

export type Client = Case["Client"];

export type Opportunities = Awaited<
  ReturnType<tRPCClient["opportunity"]["getOpportunities"]["query"]>
>;
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

  async initTRPCClient(): Promise<tRPCClient | undefined> {
    if (!this.baseUrl) return;
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

  async getStaffInfo() {
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

  async getCaseDetails(caseId: string) {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    const fetchedData = await this.trpcClient.case.getCase.query({
      id: caseId,
    });
    return fetchedData;
  }

  async updateCaseDetails(caseId: string, attributes: FormAttributes) {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    return await this.trpcClient.case.updateCase.mutate({
      id: caseId,
      attributes,
    });
  }

  async getCommunityOpportunities(): Promise<Opportunities> {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    const fetchedData =
      await this.trpcClient.opportunity.getOpportunities.query();

    return fetchedData;
  }

  async getOffenses(): Promise<string[]> {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    const fetchedData = await this.trpcClient.offense.getOffenses.query();

    return fetchedData;
  }
}
