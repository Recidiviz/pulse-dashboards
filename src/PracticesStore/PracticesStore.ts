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
  searchClients,
  StaffRecord,
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

  districtFilter: string[] = [];

  officerFilter: string[] = [];

  searchFilter?: string;

  private compliantReportingEligibleCount?: SubscriptionValue<number>;

  private clients?: Client[];

  private officers?: SubscriptionValue<StaffRecord[]>;

  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });

    // trigger some updates when filters change
    reaction(
      () => [this.officerFilter],
      () => {
        this.updateCaseloadSources();
      }
    );
    reaction(
      () => [this.searchFilter, this.officerFilter],
      () => {
        this.updateSearchSources();
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
          this.updateStateData(
            (userRecord as CombinedUserRecord).info.stateCode
          );
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

  /**
   * Updates data sources queried based on current state code
   */
  private updateStateData(stateCode: string) {
    this.officers = observableSubscription((handler) =>
      subscribeToOfficers(stateCode, handler)
    );
  }

  private setDefaultCaseload(userData: CombinedUserRecord) {
    if (userData.updates?.savedDistricts || userData.updates?.savedOfficers) {
      this.districtFilter = userData.updates.savedDistricts ?? [];
      this.officerFilter = userData.updates.savedOfficers ?? [];
    } else {
      this.districtFilter = userData.info.district
        ? [userData.info.district]
        : [];
      this.officerFilter = [userData.info.id];
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
            this.officerFilter,
            handler
          );
        }
      );
    }
  }

  get opportunityCounts(): Record<OpportunityType, number | undefined> {
    return {
      compliantReporting: this.compliantReportingEligibleCount?.current(),
    };
  }

  /**
   * Updates data sources queried based on current search string
   */
  private updateSearchSources() {
    if (this.searchFilter && this.user) {
      searchClients(
        this.user.info.stateCode,
        this.officerFilter,
        this.searchFilter
      ).then((records) => {
        runInAction(() => {
          this.clients = records.map((r) => new Client(r));
        });
      });
    } else {
      this.clients = undefined;
    }
  }

  get filteredOfficers(): StaffRecord[] {
    const searchFilter = this.searchFilter || "";
    const searchFilterNormalized = searchFilter.toLowerCase();
    return (
      this.officers
        ?.current()
        ?.filter(
          (o: StaffRecord) =>
            o.name.toLowerCase().includes(searchFilterNormalized) ||
            o.id.toLowerCase().includes(searchFilterNormalized)
        ) || []
    );
  }

  get searchResults(): {
    clients?: Client[];
    officers?: StaffRecord[];
  } {
    return {
      clients: this.clients,
      officers: this.filteredOfficers,
    };
  }
}
