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

import { makeAutoObservable, reaction, runInAction } from "mobx";

import { Hydratable } from "../core/models/types";
import {
  CombinedUserRecord,
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

export class PracticesStore implements Hydratable {
  rootStore: RootStore;

  isLoading?: boolean;

  error?: Error;

  user?: CombinedUserRecord;

  selectedOfficers: string[] = [];

  private compliantReportingEligibleCount?: SubscriptionValue<number>;

  private clients?: SubscriptionValue<Client[]>;

  private officers?: SubscriptionValue<StaffRecord[]>;

  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });

    // trigger some updates when filters change
    reaction(
      () => [this.selectedOfficers],
      () => {
        this.updateCaseloadSources();
      }
    );
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
        userRecord = await getUser(email, stateCode);
      }
      // recidiviz users "impersonate" the test user for now;
      // this only works against fixture data
      // const queryEmail = isDemoProject ? "test-officer@example.com" : email;
      // const queryStateCode = stateCode === "RECIDIVIZ" ? "US_XX" : stateCode;

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

  private setDefaultCaseload(userData: CombinedUserRecord) {
    if (userData.updates?.savedOfficers) {
      this.selectedOfficers = userData.updates.savedOfficers ?? [];
    } else {
      this.selectedOfficers = userData.info.hasCaseload
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
            this.selectedOfficers,
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

      if (this.selectedOfficers.length) {
        this.clients = observableSubscription((handler) =>
          subscribeToCaseloads(
            userInfo.info.stateCode,
            this.selectedOfficers,
            (results) => handler(results.map((r) => new Client(r)))
          )
        );
      } else {
        this.clients = undefined;
      }
    }
  }

  get compliantReportingEligibleClients(): Client[] {
    return (
      this.clients?.current()?.filter((c) => c.compliantReportingEligible) || []
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
}
