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
import _ from "lodash";
import { runInAction, when } from "mobx";
import moment from "moment";
import superjson from "superjson";

import type { AppRouter } from "~@sentencing-server/trpc-types";

import { FormAttributes } from "../components/CaseDetails/types";
import { PSIStore } from "../datastores/PSIStore";

export type tRPCClient = CreateTRPCProxyClient<AppRouter>;

export type Staff = Awaited<ReturnType<APIClient["getStaffInfo"]>>;

export type StaffCases = Staff["cases"];

export type StaffCase = StaffCases[number];

export type Case = Awaited<ReturnType<APIClient["getCaseDetails"]>>;

export type CaseInsight = NonNullable<Case["insight"]>;

export type Insight = Awaited<ReturnType<APIClient["getInsight"]>>;

export type Offenses = Awaited<ReturnType<APIClient["getOffenses"]>>;

export type Counties = Awaited<ReturnType<APIClient["getCounties"]>>;

export type Client = NonNullable<Case["client"]>;

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

    const rootStore = this.psiStore.rootStore;

    return createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: this.baseUrl,
          async headers() {
            if (!rootStore.userStore.getToken) return {};
            const token = await rootStore.userStore.getToken();
            const stateCode = rootStore.currentTenantId;

            return {
              Authorization: `Bearer ${token}`,
              StateCode: `${stateCode}`,
            };
          },
        }),
      ],
      // Required to get Date objects to serialize correctly.
      transformer: superjson,
    });
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

    const fullNameSplit = fetchedData.client?.fullName?.trim().split(/\s+/);
    const updatedClient = fetchedData.client
      ? {
          ...fetchedData.client,
          firstName: _.capitalize(fullNameSplit?.[0]),
          lastName: _.capitalize(fullNameSplit?.[fullNameSplit.length - 1]),
        }
      : undefined;

    return {
      ...fetchedData,
      age: moment().utc().diff(fetchedData.client?.birthDate, "years"),
      client: updatedClient,
    };
  }

  async updateCaseDetails(caseId: string, attributes: FormAttributes) {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    return await this.trpcClient.case.updateCase.mutate({
      id: caseId,
      attributes,
    });
  }

  async getCommunityOpportunities(isDemoMode = false): Promise<Opportunities> {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    const fetchedData =
      await this.trpcClient.opportunity.getOpportunities.query({
        includeFindHelpPrograms: isDemoMode,
      });

    return fetchedData;
  }

  async getOffenses() {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    const fetchedData = await this.trpcClient.offense.getOffenses.query();

    return fetchedData;
  }

  async getCounties() {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    const fetchedData = await this.trpcClient.county.getCounties.query();

    return fetchedData;
  }

  async getInsight(
    offense: string,
    gender: Client["gender"],
    lsirScore: number,
    isSexOffense?: boolean | null,
    isViolentOffense?: boolean | null,
  ) {
    if (!this.trpcClient)
      return Promise.reject({ message: "No tRPC client initialized" });

    const fetchedData = await this.trpcClient.insight.getInsight.query({
      offenseName: offense,
      gender,
      lsirScore,
      isSexOffense,
      isViolentOffense,
    });

    return fetchedData;
  }
}
