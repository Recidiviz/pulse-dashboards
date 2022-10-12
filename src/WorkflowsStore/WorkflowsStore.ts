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
import tenants from "../tenants";
import { Client } from "./Client";
import {
  Opportunity,
  OPPORTUNITY_TYPES,
  OpportunityType,
} from "./Opportunity/types";
import { opportunityToSortFunctionMapping } from "./Opportunity/utils";
import {
  observableSubscription,
  staffNameComparator,
  SubscriptionValue,
} from "./utils";

type ConstructorOpts = { rootStore: RootStore };

export const OTHER_KEY = "Other";

export class WorkflowsStore implements Hydratable {
  rootStore: RootStore;

  isLoading?: boolean;

  isHydrated = false;

  error?: Error;

  user?: CombinedUserRecord;

  private userUpdatesSubscription?: SubscriptionValue<UserUpdateRecord>;

  private featureVariantRecord?: FeatureVariantRecord;

  private featureVariantsSubscription?: SubscriptionValue<FeatureVariantRecord>;

  private selectedClientPseudoId?: string;

  selectedOpportunityType?: OpportunityType;

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

  get hasOpportunities(): boolean {
    return (
      this.allOpportunitiesLoaded &&
      Object.values(this.allOpportunitiesByType).flat().length > 0
    );
  }

  /**
   * Performs initial data fetches to enable Workflows functionality and manages loading state.
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
            email,
            stateCode: currentTenantId,
            hasCaseload: false,
            givenNames: "Recidiviz",
            surname: "Staff",
          },
        };
      } else {
        userRecord = await getUser(email, stateCode);
      }

      if (userRecord) {
        const { info, updates, featureVariants } = userRecord;
        // don't include featureVariants in user object so we can keep it private
        this.setUserWithDefaults({ info, updates });
        runInAction(() => {
          this.featureVariantRecord = featureVariants;
          // subscribe to updates after the initial fetch
          this.isHydrated = true;
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
        });
      } else {
        throw new Error(`Unable to retrieve user record for ${email}`);
      }
    } catch (e) {
      runInAction(() => {
        this.error = e as Error;
        this.isHydrated = false;
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
    if (!this.rootStore.currentTenantId) return;

    const clientRecord = await getClient(
      clientId,
      this.rootStore.currentTenantId
    );
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
    if (!this.user || !this.rootStore.currentTenantId) return;

    updateSelectedOfficerIds(
      this.user.info.email,
      this.rootStore.currentTenantId,
      officerIds
    );
  }

  async updateSelectedClient(clientId?: string): Promise<void> {
    this.selectedClientPseudoId = clientId;
    if (clientId && !has(this.clients, clientId)) {
      await this.fetchClient(clientId);
    }
  }

  updateSelectedOpportunityType(opportunityType?: OpportunityType): void {
    this.selectedOpportunityType = opportunityType;
  }

  get selectedOfficers(): StaffRecord[] {
    return this.availableOfficers.filter(
      (officer) => this.selectedOfficerIds.indexOf(officer.id) !== -1
    );
  }

  private setUserWithDefaults(userData: CombinedUserRecord) {
    const updates: UserUpdateRecord = userData.updates ?? {
      stateCode: userData.info.stateCode,
    };

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
   * This provides the district to use for caseload filtering. It returns undefined if the user is enabled to see all
   * districts, or if the user does not have a district to filter by.
   */
  get caseloadDistrict(): string | undefined {
    const district = this.user?.info.district;
    const { workflowsEnableAllDistricts } = this.rootStore.tenantStore;
    return workflowsEnableAllDistricts ? undefined : district;
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
          this.caseloadDistrict,
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

  get hasMultipleOpportunities(): boolean {
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId || !tenants[currentTenantId].opportunityTypes) {
      return false;
    }
    const { opportunityTypes } = tenants[currentTenantId];
    return !!(opportunityTypes && opportunityTypes.length > 1);
  }

  get caseloadClients(): Client[] {
    return values(this.clients)
      .filter((c) => this.selectedOfficerIds.includes(c.officerId))
      .sort((a, b) => {
        return (
          ascending(a.fullName.surname, b.fullName.surname) ||
          ascending(a.fullName.givenNames, b.fullName.givenNames)
        );
      });
  }

  get eligibleOpportunities(): Record<OpportunityType, Opportunity[]> {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    OPPORTUNITY_TYPES.forEach((opportunityType) => {
      const opportunities = this.caseloadClients
        .map((c) => c.opportunitiesEligible[opportunityType])
        .filter((opp) => opp !== undefined)
        .map((opp) => opp as Opportunity)
        .sort(opportunityToSortFunctionMapping[opportunityType]);

      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return mapping;
  }

  get almostEligibleOpportunities(): Record<OpportunityType, Opportunity[]> {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    OPPORTUNITY_TYPES.forEach((opportunityType) => {
      const opportunities = this.caseloadClients
        .map((c) => c.opportunitiesAlmostEligible[opportunityType])
        .filter((opp) => opp !== undefined)
        .map((opp) => opp as Opportunity)
        .sort(opportunityToSortFunctionMapping[opportunityType]);

      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return mapping;
  }

  get allOpportunitiesLoaded(): boolean {
    // Wait until we have clients until checking that opportunities are loading.
    if (!this.caseloadClients.length) return false;
    return (
      this.potentialOpportunities.filter(
        (opp) => !(opp.isHydrated || opp.error !== undefined)
      ).length === 0 && this.selectedOfficerIds.length > 0
    );
  }

  get potentialOpportunities(): Opportunity[] {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    OPPORTUNITY_TYPES.forEach((opportunityType) => {
      const opportunities = this.caseloadClients
        .map((c) => c.opportunities[opportunityType])
        .filter((opp) => opp !== undefined);

      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return Object.values(mapping).flat();
  }

  get allOpportunitiesByType(): Record<OpportunityType, Opportunity[]> {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    OPPORTUNITY_TYPES.forEach((opportunityType) => {
      const opportunities = this.caseloadClients
        .map((c) => c.opportunities[opportunityType])
        .filter((opp) => !!opp?.isHydrated)
        .map((opp) => opp as Opportunity)
        .sort(opportunityToSortFunctionMapping[opportunityType]);

      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return mapping;
  }

  get availableOfficers(): StaffRecord[] {
    const officers = this.officers?.current() ?? [];
    officers.sort(staffNameComparator);
    return officers;
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

  /**
   * Opportunity types are ranked in order of how they should display on the Homepage
   */
  get opportunityTypes(): OpportunityType[] {
    return (
      (this.rootStore.currentTenantId &&
        tenants[this.rootStore.currentTenantId].opportunityTypes) ??
      []
    );
  }
}
