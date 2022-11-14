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
import { identity, pick } from "lodash";
import {
  has,
  makeAutoObservable,
  reaction,
  set,
  toJS,
  values,
  when,
} from "mobx";
import { now } from "mobx-utils";

import { trackCaseloadSearch } from "../analytics";
import { Hydratable } from "../core/models/types";
import { FilterOption } from "../core/types/filters";
import filterOptions, {
  DefaultPopulationFilterOptions,
} from "../core/utils/filterOptions";
import {
  ClientRecord,
  CombinedUserRecord,
  defaultFeatureVariantsActive,
  FeatureVariant,
  FeatureVariantRecord,
  getClient,
  StaffRecord,
  updateSelectedOfficerIds,
  UserMetadata,
  UserUpdateRecord,
} from "../firestore";
import type { RootStore } from "../RootStore";
import tenants from "../tenants";
import { Client, UNKNOWN } from "./Client";
import {
  Opportunity,
  OPPORTUNITY_TYPES,
  OpportunityType,
} from "./Opportunity/types";
import { opportunityToSortFunctionMapping } from "./Opportunity/utils";
import {
  ClientsSubscription,
  CollectionDocumentSubscription,
  StaffSubscription,
  UserSubscription,
} from "./subscriptions";
import { staffNameComparator } from "./utils";

type ConstructorOpts = { rootStore: RootStore };

export class WorkflowsStore implements Hydratable {
  rootStore: RootStore;

  private hydrationError?: unknown;

  userSubscription: UserSubscription;

  userUpdatesSubscription?: CollectionDocumentSubscription<UserUpdateRecord>;

  featureVariantsSubscription?: CollectionDocumentSubscription<FeatureVariantRecord>;

  private selectedClientPseudoId?: string;

  selectedOpportunityType?: OpportunityType;

  clients: Record<string, Client> = {};

  officersSubscription: StaffSubscription;

  clientsSubscription: ClientsSubscription;

  private formPrintingFlag = false;

  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable(this, {
      rootStore: false,
      formatSupervisionLevel: false,
    });

    this.officersSubscription = new StaffSubscription(rootStore);
    this.clientsSubscription = new ClientsSubscription(this);
    this.userSubscription = new UserSubscription(rootStore);

    // persistent storage for clients across subscription changes
    reaction(
      () => [this.clientsSubscription.data],
      ([newClients]) => {
        this.updateClients(newClients);
      }
    );

    // clear saved caseload search when changing tenants, to prevent cross-contamination
    reaction(
      () => [this.rootStore.currentTenantId],
      () => {
        this.updateSelectedOfficers([]);
      }
    );

    // log default caseload search injection, when applicable
    when(
      () => !!this.user,
      () => {
        const { selectedOfficerIds } = this.user?.updates ?? {};
        const { isDefaultOfficerSelection } = this.user?.metadata ?? {};
        if (selectedOfficerIds && isDefaultOfficerSelection) {
          trackCaseloadSearch({
            officerCount: selectedOfficerIds.length,
            isDefault: true,
          });
        }
      }
    );
  }

  hasOpportunities(opportunityTypes: OpportunityType[]): boolean {
    const opportunitiesByTypes = pick(
      this.allOpportunitiesByType,
      opportunityTypes
    );
    return (
      this.opportunitiesLoaded(opportunityTypes) &&
      Object.values(opportunitiesByTypes).flat().length > 0
    );
  }

  /**
   * Performs initial data fetches to enable Workflows functionality and manages loading state.
   * Expects user authentication to already be complete.
   */
  hydrate(): void {
    try {
      const { userStore } = this.rootStore;
      const { user } = userStore;
      const email = user?.email;

      if (!email) {
        // We expect the user to already be authenticated
        throw new Error("Missing email for current user.");
      }

      this.userSubscription.hydrate();

      // we don't really ever expect the user to change during a session,
      // so to prevent memory leaks we will not overwrite existing subscription objects
      if (!this.userUpdatesSubscription) {
        this.userUpdatesSubscription = new CollectionDocumentSubscription(
          "userUpdates",
          email.toLowerCase()
        );
      }
      this.userUpdatesSubscription.hydrate();

      if (!this.featureVariantsSubscription) {
        this.featureVariantsSubscription = new CollectionDocumentSubscription(
          "featureVariants",
          email.toLowerCase()
        );
      }
      this.featureVariantsSubscription.hydrate();
    } catch (e) {
      this.hydrationError = e;
    }
  }

  get isHydrated(): boolean {
    return !!(
      this.userSubscription.isHydrated &&
      this.userUpdatesSubscription?.isHydrated &&
      this.featureVariantsSubscription?.isHydrated &&
      // error and hydration are mutually exclusive for this class
      !this.error
    );
  }

  get isLoading(): boolean | undefined {
    const subsLoading = [
      this.userSubscription.isLoading,
      this.userUpdatesSubscription?.isLoading,
      this.featureVariantsSubscription?.isLoading,
    ];

    if (subsLoading.some((status) => status === undefined)) return undefined;

    return subsLoading.some(identity);
  }

  get error(): Error | undefined {
    const errorSources = [
      this.hydrationError,
      this.userSubscription.error,
      this.userUpdatesSubscription?.error,
      this.featureVariantsSubscription?.error,
    ].filter(identity);

    if (errorSources.length) return new AggregateError(errorSources);
  }

  get user(): CombinedUserRecord | undefined {
    if (!this.isHydrated) return undefined;

    const [info] = this.userSubscription.data;

    const updates = this.userUpdatesSubscription?.data ?? {
      stateCode: info.stateCode,
    };

    const metadata: UserMetadata = {};

    // set default caseload to the user's own, when applicable
    if (!updates.selectedOfficerIds && info.hasCaseload) {
      updates.selectedOfficerIds = [info.id];
      metadata.isDefaultOfficerSelection = true;
    }

    return { info, updates, metadata };
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
      const existingClient = this.clients[record.pseudonymizedId];
      if (existingClient) {
        existingClient.updateRecord(record);
      } else {
        set(
          this.clients,
          record.pseudonymizedId,
          new Client(record, this.rootStore)
        );
      }
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

  /**
   * This provides the district to use for caseload filtering. It returns undefined if the user is enabled to see all
   * districts, or if the user does not have a district to filter by.
   */
  get caseloadDistrict(): string | undefined {
    const district = this.user?.info.district;
    const { workflowsEnableAllDistricts } = this.rootStore.tenantStore;
    return workflowsEnableAllDistricts ? undefined : district;
  }

  get hasMultipleOpportunities(): boolean {
    const { opportunityTypes } = this;
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

  opportunitiesLoaded(opportunityTypes: OpportunityType[]): boolean {
    // Wait until we have clients until checking that opportunities are loading.
    if (
      !this.caseloadClients.length &&
      (!this.clientsSubscription.isHydrated ||
        this.clientsSubscription.isLoading)
    ) {
      return false;
    }
    return (
      this.potentialOpportunities(opportunityTypes).filter(
        (opp) => opp.isLoading !== false
      ).length === 0 && this.selectedOfficerIds.length > 0
    );
  }

  potentialOpportunities(opportunityTypes: OpportunityType[]): Opportunity[] {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    opportunityTypes.forEach((opportunityType) => {
      const opportunities = this.caseloadClients
        .map((c) => c.potentialOpportunities[opportunityType])
        .filter((opp) => opp !== undefined);
      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return Object.values(mapping).flat();
  }

  get allOpportunitiesByType(): Record<OpportunityType, Opportunity[]> {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    OPPORTUNITY_TYPES.forEach((opportunityType) => {
      const opportunities = this.caseloadClients
        .map((c) => c.verifiedOpportunities[opportunityType])
        .filter((opp) => !!opp)
        .map((opp) => opp as Opportunity)
        .sort(opportunityToSortFunctionMapping[opportunityType]);

      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return mapping;
  }

  get availableOfficers(): StaffRecord[] {
    const officers = [...this.officersSubscription.data];
    officers.sort(staffNameComparator);
    return officers;
  }

  get selectedClient(): Client | undefined {
    return this.selectedClientPseudoId
      ? this.clients[this.selectedClientPseudoId]
      : undefined;
  }

  /**
   * All feature variants currently active for this user, taking into account
   * the activeDate for each feature and observing the current Date for reactivity
   */
  get featureVariants(): Partial<Record<FeatureVariant, { variant?: string }>> {
    if (!this.featureVariantsSubscription?.isHydrated) return {};

    const featureVariantsRecord = this.featureVariantsSubscription?.data;

    const configuredFlags = Object.entries(
      // need a plain object without mobx annotations for iteration
      featureVariantsRecord ? toJS(featureVariantsRecord) : {}
    );
    // for internal users, all flags default to on rather than off
    if (
      !configuredFlags.length &&
      this.rootStore.userStore.stateCode === "RECIDIVIZ"
    ) {
      return defaultFeatureVariantsActive;
    }

    return configuredFlags.reduce(
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

  /**
   * Opportunity types are ranked in order of how they should display on the Homepage
   */
  get opportunityTypes(): OpportunityType[] {
    const {
      isHydrated,
      rootStore: { currentTenantId },
    } = this;
    if (!isHydrated || !currentTenantId) return [];

    let opportunityTypes = tenants[currentTenantId]?.opportunityTypes ?? [];

    if (
      currentTenantId === "US_TN" &&
      !this.featureVariants.usTnSupervisionLevelDowngrade
    ) {
      opportunityTypes = opportunityTypes.filter(
        (oppType) => oppType !== "supervisionLevelDowngrade"
      );
    }
    if (currentTenantId === "US_TN" && !this.featureVariants.usTnExpiration) {
      opportunityTypes = opportunityTypes.filter(
        (oppType) => oppType !== "usTnExpiration"
      );
    }

    return opportunityTypes;
  }

  /**
   * Mapping of known supervision levels for the current tenant
   */
  get supervisionLevels(): FilterOption[] {
    const { currentTenantId } = this.rootStore;
    const options =
      // the key is not guaranteed to be present, which is why we need a fallback
      filterOptions[(currentTenantId ?? "") as keyof typeof filterOptions] ??
      DefaultPopulationFilterOptions;
    return options.supervisionLevel.options;
  }

  formatSupervisionLevel(levelId: string | undefined): string {
    return (
      this.supervisionLevels.find((opt) => opt.value === levelId)?.label ??
      UNKNOWN
    );
  }

  get formIsPrinting(): boolean {
    return this.formPrintingFlag;
  }

  set formIsPrinting(value: boolean) {
    this.formPrintingFlag = value;
  }
}
