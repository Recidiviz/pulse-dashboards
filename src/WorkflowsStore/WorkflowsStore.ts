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

import assertNever from "assert-never";
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
import { Hydratable, SystemId } from "../core/models/types";
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
  getResident,
  ResidentRecord,
  StaffRecord,
  updateSelectedOfficerIds,
  UserMetadata,
  UserUpdateRecord,
} from "../firestore";
import type { RootStore } from "../RootStore";
import tenants from "../tenants";
import { Client, UNKNOWN } from "./Client";
import { Opportunity, OpportunityType } from "./Opportunity/types";
import { opportunityToSortFunctionMapping } from "./Opportunity/utils";
import { Resident } from "./Resident";
import {
  CaseloadSubscription,
  CollectionDocumentSubscription,
  StaffSubscription,
  UserSubscription,
} from "./subscriptions";
import { JusticeInvolvedPerson } from "./types";
import { staffNameComparator } from "./utils";

type ConstructorOpts = { rootStore: RootStore };

export class WorkflowsStore implements Hydratable {
  rootStore: RootStore;

  private hydrationError?: unknown;

  userSubscription: UserSubscription;

  userUpdatesSubscription?: CollectionDocumentSubscription<UserUpdateRecord>;

  featureVariantsSubscription?: CollectionDocumentSubscription<FeatureVariantRecord>;

  private selectedPersonPseudoId?: string;

  selectedOpportunityType?: OpportunityType;

  justiceInvolvedPersons: Record<string, JusticeInvolvedPerson> = {};

  officersSubscription: StaffSubscription;

  clientsSubscription: CaseloadSubscription<ClientRecord>;

  residentsSubscription: CaseloadSubscription<ResidentRecord>;

  private formPrintingFlag = false;

  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable(this, {
      rootStore: false,
      formatSupervisionLevel: false,
    });

    this.officersSubscription = new StaffSubscription(rootStore);
    this.clientsSubscription = new CaseloadSubscription<ClientRecord>(
      this,
      "clients",
      "CLIENT"
    );
    this.residentsSubscription = new CaseloadSubscription<ResidentRecord>(
      this,
      "residents",
      "RESIDENT"
    );
    this.userSubscription = new UserSubscription(rootStore);

    // persistent storage for justice-involved persons across subscription changes
    reaction(
      () => [this.caseloadSubscription?.data],
      ([newRecords]) => {
        this.updateCaseload(newRecords);
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

  async fetchPerson(personId: string): Promise<void> {
    if (!this.rootStore.currentTenantId) return;

    const personRecord =
      this.activeSystem === "SUPERVISION"
        ? await getClient(personId, this.rootStore.currentTenantId)
        : await getResident(personId, this.rootStore.currentTenantId);
    if (personRecord) {
      this.updateCaseload([personRecord]);
    } else {
      throw new Error(`person with ID ${personId} not found`);
    }
  }

  updatePerson(record: ResidentRecord, PersonClass: typeof Resident): void;

  updatePerson(record: ClientRecord, PersonClass: typeof Client): void;

  updatePerson(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    record: any,
    PersonClass: typeof Client | typeof Resident
  ): void {
    const existingPerson = this.justiceInvolvedPersons[record.pseudonymizedId];
    if (existingPerson instanceof PersonClass) {
      existingPerson.updateRecord(record);
    } else {
      set(
        this.justiceInvolvedPersons,
        record.pseudonymizedId,
        new PersonClass(record, this.rootStore)
      );
    }
  }

  updateCaseload(newPersons: (ClientRecord | ResidentRecord)[] = []): void {
    newPersons.forEach((newRecord) => {
      if (newRecord.personType === "CLIENT") {
        this.updatePerson(newRecord, Client);
      } else {
        this.updatePerson(newRecord, Resident);
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

  async updateSelectedPerson(personId?: string): Promise<void> {
    this.selectedPersonPseudoId = personId;
    if (personId && !has(this.justiceInvolvedPersons, personId)) {
      await this.fetchPerson(personId);
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

  get activeSystem(): SystemId | undefined {
    const { currentTenantId } = this.rootStore;
    const { workflowsSupportedSystems } = currentTenantId
      ? tenants[currentTenantId]
      : { workflowsSupportedSystems: undefined };

    if (!workflowsSupportedSystems?.length) {
      return;
    }
    // for now only one system per tenant is supported.
    // If there are more beyond the first one they will be ignored
    return workflowsSupportedSystems[0];
  }

  get caseloadSubscription():
    | CaseloadSubscription<ClientRecord | ResidentRecord>
    | undefined {
    switch (this.activeSystem) {
      case "INCARCERATION":
        return this.residentsSubscription;
      case "SUPERVISION":
        return this.clientsSubscription;
      case undefined:
        return;
      default:
        assertNever(this.activeSystem);
    }
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

  get caseloadPersons(): JusticeInvolvedPerson[] {
    return values(this.justiceInvolvedPersons)
      .filter((p) => this.selectedOfficerIds.includes(p.assignedStaffId))
      .sort((a, b) => {
        return (
          ascending(a.fullName.surname, b.fullName.surname) ||
          ascending(a.fullName.givenNames, b.fullName.givenNames)
        );
      });
  }

  get eligibleOpportunities(): Record<OpportunityType, Opportunity[]> {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    this.opportunityTypes.forEach((opportunityType) => {
      const opportunities = this.caseloadPersons
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
    this.opportunityTypes.forEach((opportunityType) => {
      const opportunities = this.caseloadPersons
        .map((c) => c.opportunitiesAlmostEligible[opportunityType])
        .filter((opp) => opp !== undefined)
        .map((opp) => opp as Opportunity)
        .sort(opportunityToSortFunctionMapping[opportunityType]);

      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return mapping;
  }

  opportunitiesLoaded(opportunityTypes: OpportunityType[]): boolean {
    // Wait until we have an active caseload before checking that opportunities are loading.
    if (
      !this.caseloadPersons.length &&
      (!this.caseloadSubscription?.isHydrated ||
        this.caseloadSubscription.isLoading)
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
      const opportunities = this.caseloadPersons
        .map((c) => c.potentialOpportunities[opportunityType])
        .filter((opp) => opp !== undefined);
      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return Object.values(mapping).flat();
  }

  get allOpportunitiesByType(): Record<OpportunityType, Opportunity[]> {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    this.opportunityTypes.forEach((opportunityType) => {
      const opportunities = this.caseloadPersons
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

  get selectedPerson(): JusticeInvolvedPerson | undefined {
    return this.selectedPersonPseudoId
      ? this.justiceInvolvedPersons[this.selectedPersonPseudoId]
      : undefined;
  }

  get selectedClient(): Client | undefined {
    return this.selectedPerson instanceof Client
      ? this.selectedPerson
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
