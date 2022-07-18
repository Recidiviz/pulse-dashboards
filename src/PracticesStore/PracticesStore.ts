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

import { ascending } from "d3-array";
import {
  entries,
  has,
  makeAutoObservable,
  reaction,
  runInAction,
  set,
  values,
  when,
} from "mobx";
import { now } from "mobx-utils";

import { trackCaseloadSearch } from "../analytics";
import { Hydratable } from "../core/models/types";
import {
  ClientRecord,
  CombinedUserRecord,
  FeatureVariant,
  FeatureVariantRecord,
  getClient,
  getUser,
  OpportunityType,
  StaffRecord,
  subscribeToCaseloads,
  subscribeToEligibleCount,
  subscribeToFeatureVariants,
  subscribeToOfficers,
  subscribeToUserUpdates,
  updateSelectedOfficerIds,
  UserUpdateRecord,
} from "../firestore";
import type { RootStore } from "../RootStore";
import { Client, OPPORTUNITY_STATUS_RANKED } from "./Client";
import { observableSubscription, SubscriptionValue } from "./utils";

type ConstructorOpts = { rootStore: RootStore };

export const OTHER_KEY = "Other";

export class PracticesStore implements Hydratable {
  rootStore: RootStore;

  isLoading?: boolean;

  error?: Error;

  user?: CombinedUserRecord;

  private userUpdatesSubscription?: SubscriptionValue<UserUpdateRecord>;

  private featureVariantRecord?: FeatureVariantRecord;

  private featureVariantsSubscription?: SubscriptionValue<FeatureVariantRecord>;

  private selectedClientPseudoId?: string;

  private compliantReportingEligibleCount?: SubscriptionValue<number>;

  private clientsSubscription?: SubscriptionValue<ClientRecord[]>;

  clients: Record<string, Client> = {};

  private officers?: SubscriptionValue<StaffRecord[]>;

  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });

    // update caseload subscriptions when selection changes
    reaction(
      () => [this.selectedOfficerIds],
      () => {
        this.updateCaseloadSources();
      }
    );

    // force new caseload data subscriptions when feature flags change,
    // because data sources may be affected by flags
    reaction(
      () => [this.featureVariantRecord],
      () => {
        this.updateCaseloadSources();
        if (this.selectedClientPseudoId) {
          this.fetchClient(this.selectedClientPseudoId);
        }
      }
    );

    // persistent storage for subscription results
    reaction(
      () => [this.clientsSubscription?.current()],
      ([newClients]) => {
        this.updateClients(newClients);
      }
    );
    reaction(
      () => [this.userUpdatesSubscription?.current()],
      ([userUpdates]) => {
        runInAction(() => {
          if (this.user && userUpdates) {
            this.user.updates = userUpdates;
          }
        });
      }
    );
    reaction(
      () => [this.featureVariantsSubscription?.current()],
      ([featureVariants]) => {
        runInAction(() => {
          // featureVariants should only be undefined while the initial fetch is pending
          if (featureVariants) {
            this.featureVariantRecord = featureVariants;
          }
        });
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
        userRecord = await getUser(email);
      }

      if (userRecord) {
        const { info, updates, featureVariants } = userRecord;
        // don't include featureVariants in user object so we can keep it private
        this.setUserWithDefaults({ info, updates });
        this.featureVariantRecord = featureVariants;
        // subscribe to updates after the initial fetch
        this.userUpdatesSubscription = observableSubscription((syncToStore) =>
          subscribeToUserUpdates(email, (userUpdates) => {
            if (userUpdates) syncToStore(userUpdates);
          })
        );
        this.featureVariantsSubscription = observableSubscription(
          (syncToStore) =>
            subscribeToFeatureVariants(email, (featureVariantUpdate) => {
              // returning an empty objects helps us distinguish finding no result from awaiting
              // the initial result (which will be exposed on the subscription as undefined)
              syncToStore(featureVariantUpdate ?? {});
            })
        );
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

  get selectedOfficerIds(): string[] {
    return this.user?.updates?.selectedOfficerIds ?? [];
  }

  async fetchClient(clientId: string): Promise<void> {
    const clientRecord = await getClient(clientId);
    if (clientRecord) {
      this.updateClients([clientRecord]);
    } else {
      throw new Error(`client ${clientId} not found`);
    }
  }

  updateClients(newClients: ClientRecord[] = []): void {
    newClients.forEach((record) => {
      set(
        this.clients,
        record.pseudonymizedId,
        new Client(record, this.rootStore)
      );
    });
  }

  updateSelectedOfficers(officerIds: string[]): void {
    if (!this.user) return;
    updateSelectedOfficerIds(this.user.info.email, officerIds);
  }

  async updateSelectedClient(clientId?: string): Promise<void> {
    this.selectedClientPseudoId = clientId;
    if (clientId && !has(this.clients, clientId)) {
      await this.fetchClient(clientId);
    }
  }

  get selectedOfficers(): StaffRecord[] {
    return this.availableOfficers.filter(
      (officer) => this.selectedOfficerIds.indexOf(officer.id) !== -1
    );
  }

  private setUserWithDefaults(userData: CombinedUserRecord) {
    const updates: UserUpdateRecord = userData.updates ?? {};

    let selectedOfficerIds = updates.selectedOfficerIds ?? [];

    if (!selectedOfficerIds.length) {
      if (updates.savedOfficers?.length) {
        selectedOfficerIds = updates.savedOfficers;
      } else if (userData.info.hasCaseload) {
        selectedOfficerIds = [userData.info.id];
      }
    }

    updates.selectedOfficerIds = selectedOfficerIds;

    this.user = { ...userData, updates };

    trackCaseloadSearch({
      officerCount: selectedOfficerIds.length,
      isDefault: true,
    });
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

  private get compliantReportingEligibleClients(): Client[] {
    return values(this.clients)
      .filter(
        (c) =>
          this.selectedOfficerIds.includes(c.officerId) &&
          c.opportunitiesEligible.compliantReporting !== undefined
      )
      .sort((a, b) => {
        // hierarchical sort: review status > last name > first name
        return (
          ascending(
            OPPORTUNITY_STATUS_RANKED.indexOf(
              a.reviewStatus.compliantReporting
            ),
            OPPORTUNITY_STATUS_RANKED.indexOf(b.reviewStatus.compliantReporting)
          ) ||
          ascending(a.fullName.surname, b.fullName.surname) ||
          ascending(a.fullName.givenNames, b.fullName.givenNames)
        );
      });
  }

  get opportunityEligibleClients(): Record<OpportunityType, Client[]> {
    return {
      compliantReporting: this.compliantReportingEligibleClients,
    };
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
    return this.selectedClientPseudoId
      ? this.clients[this.selectedClientPseudoId]
      : undefined;
  }

  async trackClientFormViewed(
    clientId: string,
    formType: OpportunityType
  ): Promise<void> {
    await when(() => this.clients[clientId] !== undefined);

    this.clients[clientId].trackFormViewed(formType);
  }

  /**
   * All feature variants currently active for this user, taking into account
   * the activeDate for each feature and observing the current Date for reactivity
   */
  get featureVariants(): Partial<Record<FeatureVariant, { variant?: string }>> {
    if (this.featureVariantRecord) {
      return entries(this.featureVariantRecord).reduce(
        (activeVariants, [variantName, variantInfo]) => {
          if (!variantInfo) return activeVariants;

          const { variant, activeDate } = variantInfo;
          // check date once a minute so there isn't too much lag when we cross the threshold
          if (activeDate && activeDate.toMillis() > now(1000 * 60))
            return activeVariants;
          return { ...activeVariants, [variantName]: { variant } };
        },
        {}
      );
    }

    return {};
  }
}
