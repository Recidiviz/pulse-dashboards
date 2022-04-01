// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  autorun,
  has,
  makeAutoObservable,
  reaction,
  runInAction,
  set,
  values,
} from "mobx";

import { Hydratable } from "../core/models/types";
import {
  ClientRecord,
  CombinedUserRecord,
  getClient,
  getUser,
  OpportunityType,
  StaffRecord,
  subscribeToCaseloads,
  subscribeToEligibleCount,
  subscribeToOfficers,
} from "../firestore";
import type { RootStore } from "../RootStore";
import { Client } from "./Client";
import { observableSubscription, SubscriptionValue } from "./utils";

type ConstructorOpts = { rootStore: RootStore };

export const OTHER_KEY = "Other";

export class PracticesStore implements Hydratable {
  rootStore: RootStore;

  isLoading?: boolean;

  error?: Error;

  user?: CombinedUserRecord;

  selectedOfficerIds: string[] = [];

  selectedClientId?: string;

  private compliantReportingEligibleCount?: SubscriptionValue<number>;

  private clientsSubscription?: SubscriptionValue<ClientRecord[]>;

  clients: Record<string, Client> = {};

  private officers?: SubscriptionValue<StaffRecord[]>;

  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });

    // trigger some updates when filters change
    reaction(
      () => [this.selectedOfficerIds],
      () => {
        this.updateCaseloadSources();
      }
    );

    // persistent storage for subscription results
    reaction(
      () => [this.clientsSubscription?.current()],
      ([newClients]) => {
        this.updateClients(newClients);
      }
    );

    // try to fetch clients that aren't already in our subscription
    autorun(async () => {
      if (this.selectedClientId && !has(this.clients, this.selectedClientId)) {
        this.fetchClient(this.selectedClientId);
      }
    });
  }

  /**
   * Performs initial data fetches to enable Practices functionality and manages loading state.
   * Expects user authentication to already be complete.
   */
  async hydrate(): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
      this.error = undefined;
    });
    try {
      const { userStore, currentTenantId } = this.rootStore;
      const { user, stateCode } = userStore;
      const email = user?.email;

      if (!email) {
        // We expect the user to already be authenticated
        throw new Error("Missing email for current user.");
      }

      let userRecord: CombinedUserRecord | undefined;
      if (stateCode === "RECIDIVIZ" && currentTenantId) {
        userRecord = {
          info: {
            id: "RECIDIVIZ",
            name: email,
            email,
            stateCode: currentTenantId,
            hasCaseload: false,
          },
        };
      } else {
        userRecord = await getUser(email);
      }

      if (userRecord) {
        runInAction(() => {
          this.user = userRecord;
          this.setDefaultCaseload(userRecord as CombinedUserRecord);
        });
      } else {
        throw new Error(`Unable to retrieve user record for ${email}`);
      }
    } catch (e) {
      runInAction(() => {
        this.error = e;
      });
    }
    runInAction(() => {
      this.isLoading = false;
    });
  }

  async fetchClient(clientId: string): Promise<void> {
    const clientRecord = await getClient(clientId);
    if (clientRecord) {
      this.updateClients([clientRecord]);
    }
  }

  updateClients(newClients: ClientRecord[] = []): void {
    newClients.forEach((record) => {
      set(
        this.clients,
        record.personExternalId,
        new Client(record, this.rootStore)
      );
    });
  }

  updateSelectedOfficers(officerIds: string[]): void {
    this.selectedOfficerIds = officerIds;
  }

  updateSelectedClient(clientId?: string): void {
    this.selectedClientId = clientId;
  }

  get selectedOfficers(): StaffRecord[] {
    return this.availableOfficers.filter(
      (officer) => this.selectedOfficerIds.indexOf(officer.id) !== -1
    );
  }

  private setDefaultCaseload(userData: CombinedUserRecord) {
    if (userData.updates?.savedOfficers) {
      this.selectedOfficerIds = userData.updates.savedOfficers ?? [];
    } else {
      this.selectedOfficerIds = userData.info.hasCaseload
        ? [userData.info.id]
        : [];
    }
  }

  /**
   * Updates data sources queried based on current caseload
   */
  private updateCaseloadSources() {
    const { user: userInfo } = this;

    if (userInfo) {
      this.compliantReportingEligibleCount = observableSubscription(
        (handler) => {
          return subscribeToEligibleCount(
            "compliantReporting",
            userInfo.info.stateCode,
            this.selectedOfficerIds,
            handler
          );
        }
      );
      this.officers = observableSubscription((handler) =>
        subscribeToOfficers(
          userInfo.info.stateCode,
          userInfo.info.district,
          handler
        )
      );

      if (this.selectedOfficerIds.length) {
        this.clientsSubscription = observableSubscription((syncToStore) =>
          subscribeToCaseloads(
            userInfo.info.stateCode,
            this.selectedOfficerIds,
            (results) => syncToStore(results)
          )
        );
      } else {
        this.clientsSubscription = undefined;
      }
    }
  }

  get compliantReportingEligibleClients(): Client[] {
    return values(this.clients).filter(
      (c) =>
        this.selectedOfficerIds.includes(c.officerId) &&
        c.compliantReportingEligible
    );
  }

  get opportunityCounts(): Record<OpportunityType, number | undefined> {
    return {
      compliantReporting: this.compliantReportingEligibleCount?.current(),
    };
  }

  get availableOfficers(): StaffRecord[] {
    return this.officers?.current() ?? [];
  }

  get selectedClient(): Client | undefined {
    return this.selectedClientId
      ? this.clients[this.selectedClientId]
      : undefined;
  }
}
