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
import {
  groupBy,
  identity,
  intersection,
  mapValues,
  pick,
  sortBy,
} from "lodash";
import {
  action,
  has,
  makeAutoObservable,
  reaction,
  runInAction,
  set,
  toJS,
  values,
  when,
} from "mobx";
import { now } from "mobx-utils";

import {
  Hydratable,
  Searchable,
  SearchType,
  SystemId,
  WorkflowsSystemConfig,
} from "../core/models/types";
import { FilterOption } from "../core/types/filters";
import filterOptions, {
  DefaultPopulationFilterOptions,
} from "../core/utils/filterOptions";
import { WorkflowsPage } from "../core/views";
import {
  ClientRecord,
  CombinedUserRecord,
  defaultFeatureVariantsActive,
  FeatureVariant,
  FeatureVariantRecord,
  LocationRecord,
  ResidentRecord,
  StaffRecord,
  UserMetadata,
  UserRole,
  UserUpdateRecord,
} from "../FirestoreStore";
import type { RootStore } from "../RootStore";
import tenants from "../tenants";
import { Client, isClient, UNKNOWN } from "./Client";
import { Location } from "./Location";
import { Officer } from "./Officer";
import {
  Opportunity,
  opportunityToSortFunctionMapping,
  OpportunityType,
} from "./Opportunity";
import { Resident } from "./Resident";
import {
  CaseloadSubscription,
  CollectionDocumentSubscription,
  LocationSubscription,
  StaffSubscription,
  UserSubscription,
} from "./subscriptions";
import { WorkflowsTasksStore } from "./Task/WorkflowsTasksStore";
import { EligibilityStatus, JusticeInvolvedPerson } from "./types";
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

  locationsSubscription: LocationSubscription;

  private formDownloadingFlag = false;

  workflowsTasksStore: WorkflowsTasksStore;

  activeSystem?: SystemId;

  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable(this, {
      rootStore: false,
      formatSupervisionLevel: false,
      hydrate: action,
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
    this.locationsSubscription = new LocationSubscription(rootStore);
    // persistent storage for justice-involved persons across subscription changes
    reaction(
      () => [this.caseloadSubscription?.map((s) => s.data).flat()],
      ([newRecords]) => {
        this.updateCaseload(newRecords);
      }
    );

    // clear saved caseload and search when changing tenants, to prevent cross-contamination
    reaction(
      () => [this.rootStore.currentTenantId],
      () => {
        this.updateSelectedSearch([]);
        this.justiceInvolvedPersons = {};
      }
    );

    // log default caseload search injection, when applicable
    when(
      () => !!this.user,
      () => {
        const { selectedSearchIds, selectedOfficerIds } =
          this.user?.updates ?? {};
        const { isDefaultOfficerSelection } = this.user?.metadata ?? {};
        const selectedSearch = selectedSearchIds ?? selectedOfficerIds;

        if (selectedSearch && isDefaultOfficerSelection) {
          this.rootStore.analyticsStore.trackCaseloadSearch({
            searchCount: selectedSearch.length,
            isDefault: true,
            searchType: "OFFICER",
          });
        }
      }
    );

    this.workflowsTasksStore = new WorkflowsTasksStore(this);
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
      const { userStore, firestoreStore } = this.rootStore;
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
          firestoreStore,
          "userUpdates",
          email.toLowerCase()
        );
      }
      this.userUpdatesSubscription.hydrate();

      if (!this.featureVariantsSubscription) {
        this.featureVariantsSubscription = new CollectionDocumentSubscription(
          firestoreStore,
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

  disposeUserProfileSubscriptions(): void {
    this.userUpdatesSubscription?.unsubscribe();
    this.featureVariantsSubscription?.unsubscribe();

    this.userUpdatesSubscription = undefined;
    this.featureVariantsSubscription = undefined;
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

    if (this.rootStore.userStore.userRole) {
      set(info, { role: this.rootStore.userStore.userRole });
    }

    const updates = this.userUpdatesSubscription?.data ?? {
      stateCode: info.stateCode,
    };

    const metadata: UserMetadata = {};

    // set default caseload to the user's own, when applicable
    if (
      !(updates.selectedOfficerIds || updates.selectedSearchIds) &&
      info.hasCaseload &&
      this.searchType === "OFFICER"
    ) {
      updates.selectedSearchIds = [info.id];
      metadata.isDefaultOfficerSelection = true;
    }

    return { info, updates, metadata };
  }

  get selectedSearchIds(): string[] {
    return (
      this.user?.updates?.selectedSearchIds ??
      // fall back to selectedOfficerIds since the field was renamed from that to selectedSearchIds
      // TODO(#3154) get rid of selectedOfficerIds altogether
      this.user?.updates?.selectedOfficerIds ??
      []
    );
  }

  async fetchPerson(personId: string): Promise<void> {
    if (!this.rootStore.currentTenantId) return;

    const personRecord =
      this.activeSystem === "SUPERVISION"
        ? await this.rootStore.firestoreStore.getClient(
            personId,
            this.rootStore.currentTenantId
          )
        : await this.rootStore.firestoreStore.getResident(
            personId,
            this.rootStore.currentTenantId
          );
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

  updateSelectedSearch(searchIds: string[]): void {
    if (!this.user || !this.rootStore.currentTenantId) return;

    this.rootStore.firestoreStore.updateSelectedSearchIds(
      this.user.info.email,
      this.rootStore.currentTenantId,
      searchIds
    );
  }

  async updateSelectedPerson(personId?: string): Promise<void> {
    if (personId && !has(this.justiceInvolvedPersons, personId)) {
      await this.fetchPerson(personId);
    }

    runInAction(() => {
      this.selectedPersonPseudoId = personId;
    });
  }

  updateSelectedOpportunityType(opportunityType?: OpportunityType): void {
    runInAction(() => {
      this.selectedOpportunityType = opportunityType;
    });
  }

  get selectedSearchables(): Searchable[] {
    return this.availableSearchables.filter((searchable) =>
      this.selectedSearchIds.includes(searchable.searchId)
    );
  }

  /** List of supported systems based on the user's permissions. */
  get workflowsSupportedSystems(): SystemId[] | undefined {
    const {
      currentTenantId,
      userStore: { isRecidivizUser },
    } = this.rootStore;

    if (!currentTenantId) return;
    const workflowsSupportedSystems =
      tenants[currentTenantId].workflowsSupportedSystems ?? [];

    if (isRecidivizUser) {
      return workflowsSupportedSystems;
    }

    const roleAllowedSystems: Record<UserRole, SystemId[]> = {
      supervision_staff: ["SUPERVISION"],
      facilities_staff: ["INCARCERATION"],
      leadership_role: ["SUPERVISION", "INCARCERATION"],
    };

    const role = this.user?.info.role;

    return role
      ? intersection(workflowsSupportedSystems, roleAllowedSystems[role])
      : undefined;
  }

  updateActiveSystem(systemId: SystemId): void {
    runInAction(() => {
      this.activeSystem = systemId;
    });
  }

  get searchType(): SearchType | undefined {
    if (this.activeSystem === "ALL") return "ALL";
    return this.activeSystemConfig?.searchType;
  }

  get searchField(): keyof ClientRecord | keyof ResidentRecord {
    const searchField = this.activeSystemConfig?.searchField;
    if (searchField) {
      return searchField;
    }

    if (this.searchType === "LOCATION") {
      return "facilityId";
    }
    return "officerId";
  }

  get caseloadSubscription():
    | CaseloadSubscription<ClientRecord>[]
    | CaseloadSubscription<ResidentRecord>[]
    | (
        | CaseloadSubscription<ClientRecord>
        | CaseloadSubscription<ResidentRecord>
      )[]
    | undefined {
    switch (this.activeSystem) {
      case "INCARCERATION":
        return [this.residentsSubscription];
      case "SUPERVISION":
        return [this.clientsSubscription];
      case "ALL":
        return [this.residentsSubscription, this.clientsSubscription];
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
      .filter((p) => this.selectedSearchIds.includes(p.searchIdValue))
      .sort((a, b) => {
        return (
          ascending(a.fullName.surname, b.fullName.surname) ||
          ascending(a.fullName.givenNames, b.fullName.givenNames)
        );
      });
  }

  get milestonesClients(): Client[] {
    return this.caseloadPersons.filter((person) => {
      return isClient(person) && (person.milestones ?? []).length > 0;
    }) as Client[];
  }

  opportunitiesByEligibilityStatus(
    opportunityStatus: EligibilityStatus
  ): Record<OpportunityType, Opportunity[]> {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    this.opportunityTypes.forEach((opportunityType) => {
      const opportunities = this.caseloadPersons
        .map((c) => c[opportunityStatus][opportunityType])
        .filter((opp) => opp !== undefined)
        .map((opp) => opp as Opportunity)
        .sort(opportunityToSortFunctionMapping[opportunityType]);

      mapping[opportunityType] = opportunities as Opportunity[];
    });
    return mapping;
  }

  get eligibleOpportunities(): Record<OpportunityType, Opportunity[]> {
    return this.opportunitiesByEligibilityStatus("opportunitiesEligible");
  }

  get almostEligibleOpportunities(): Record<OpportunityType, Opportunity[]> {
    return this.opportunitiesByEligibilityStatus("opportunitiesAlmostEligible");
  }

  get deniedOpportunities(): Record<OpportunityType, Opportunity[]> {
    return this.opportunitiesByEligibilityStatus("opportunitiesDenied");
  }

  get opportunitiesBySection(): Record<
    OpportunityType,
    Record<string, Opportunity[]>
  > {
    return mapValues(this.allOpportunitiesByType, (opps) => {
      return groupBy(opps, "sectionTitle");
    });
  }

  opportunitiesLoaded(opportunityTypes: OpportunityType[]): boolean {
    // Wait until we have an active caseload before checking that opportunities are loading.
    if (!this.caseloadLoaded()) return false;

    return (
      this.potentialOpportunities(opportunityTypes).filter(
        (opp) => opp.isLoading !== false
      ).length === 0 && this.selectedSearchIds.length > 0
    );
  }

  caseloadLoaded(): boolean {
    return (
      this.caseloadPersons.length > 0 ||
      (this.caseloadSubscription?.every((s) => s.isHydrated) &&
        !this.caseloadSubscription.some((s) => s.isLoading)) ||
      false
    );
  }

  supervisionTasksLoaded(): boolean {
    // Wait until we have an active caseload before checking that tasks are loading.
    if (!this.caseloadLoaded()) return false;
    return this.caseloadPersons.every(
      (person) => person.supervisionTasks?.isHydrated
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

  get availableLocations(): LocationRecord[] {
    const locations = [...this.locationsSubscription.data];
    return sortBy(locations, ["name"]);
  }

  get availableSearchables(): Searchable[] {
    switch (this.searchType) {
      case "LOCATION": {
        return this.availableLocations.map(
          (location) => new Location(location)
        );
      }
      case "OFFICER": {
        return this.availableOfficers
          .map((officer) => new Officer(officer))
          .filter((officer) => officer.systemId === this.activeSystem);
      }
      case "ALL": {
        const locations = this.availableLocations.map(
          (location) => new Location(location)
        );
        const officers = this.availableOfficers.map(
          (officer) => new Officer(officer)
        );
        return [...officers, ...locations];
      }
      case undefined:
        return [];
      default:
        assertNever(this.searchType);
    }
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

  get selectedResident(): Resident | undefined {
    return this.selectedPerson instanceof Resident
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

    if (currentTenantId === "US_TN" && !this.featureVariants.usTnExpiration) {
      opportunityTypes = opportunityTypes.filter(
        (oppType) => oppType !== "usTnExpiration"
      );
    }

    return opportunityTypes;
  }

  /**
   * Whether or not the loaded caseload has any supervision tasks for the selected officer.
   */
  get hasSupervisionTasks(): boolean {
    return this.caseloadPersons.some((person) => {
      return (
        person.supervisionTasks?.isHydrated &&
        person.supervisionTasks?.tasks.length > 0
      );
    });
  }

  /**
   * Whether or not this tenant has the supervision tasks feature.
   */
  get allowSupervisionTasks(): boolean {
    const {
      rootStore: { currentTenantId },
    } = this;
    if (!currentTenantId) return false;
    return !!tenants[currentTenantId]?.tasks;
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

  get formIsDownloading(): boolean {
    return this.formDownloadingFlag;
  }

  set formIsDownloading(value: boolean) {
    this.formDownloadingFlag = value;
  }

  /**
   * Title to display for the search bar in workflows
   */
  get workflowsSearchFieldTitle(): string {
    return this.activeSystemConfig?.searchTitleOverride ?? "officer";
  }

  get supportsMultipleSystems(): boolean {
    return (
      (this.workflowsSupportedSystems &&
        this.workflowsSupportedSystems.length > 1) ||
      false
    );
  }

  /**
   * Generic to use for justice-involved persons in workflows
   */
  get justiceInvolvedPersonTitle(): string {
    switch (this.activeSystem) {
      case "INCARCERATION":
        return "resident";
      case "SUPERVISION":
        return "client";
      case "ALL":
      case undefined:
        return "person";
      default:
        assertNever(this.activeSystem);
    }
  }

  get activeSystemConfig():
    | WorkflowsSystemConfig<ClientRecord>
    | WorkflowsSystemConfig<ResidentRecord>
    | undefined {
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId || !this.activeSystem || this.activeSystem === "ALL") {
      return undefined;
    }

    return (
      tenants[currentTenantId].workflowsSystemConfigs?.[this.activeSystem] ?? {
        searchField: "officerId",
        searchType: "OFFICER",
      }
    );
  }

  get homepage(): WorkflowsPage {
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId) return "home";
    return tenants[currentTenantId].workflowsHomepage ?? "home";
  }
}
