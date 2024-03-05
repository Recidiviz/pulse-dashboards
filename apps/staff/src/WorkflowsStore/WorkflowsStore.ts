/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import assertNever from "assert-never";
import { ascending } from "d3-array";
import {
  difference,
  groupBy,
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
  values,
  when,
} from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import {
  Hydratable,
  HydrationState,
  Searchable,
  SearchType,
  SystemId,
  WorkflowsSystemConfig,
} from "../core/models/types";
import {
  compositeHydrationState,
  hydrationFailure,
  isHydrated,
  isHydrationFinished,
} from "../core/models/utils";
import { FilterOption } from "../core/types/filters";
import filterOptions, {
  DefaultPopulationFilterOptions,
} from "../core/utils/filterOptions";
import { WorkflowsPage } from "../core/views";
import {
  ClientRecord,
  CombinedUserRecord,
  LocationRecord,
  MilestonesMessage,
  ResidentRecord,
  StaffRecord,
  UserMetadata,
  UserUpdateRecord,
} from "../FirestoreStore";
import type { RootStore } from "../RootStore";
import tenants from "../tenants";
import { castToError } from "../utils/castToError";
import { CaseloadSearchable } from "./CaseloadSearchable";
import { Client, isClient, UNKNOWN } from "./Client";
import { Location } from "./Location";
import { Officer } from "./Officer";
import {
  INCARCERATION_OPPORTUNITY_TYPES,
  Opportunity,
  OpportunityTab,
  SUPERVISION_OPPORTUNITY_TYPES,
} from "./Opportunity";
import {
  OPPORTUNITY_CONFIGS,
  OpportunityType,
} from "./Opportunity/OpportunityConfigs";
import { OpportunityConfigurationStore } from "./Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { Resident } from "./Resident";
import {
  CaseloadSubscription,
  CollectionDocumentSubscription,
  LocationSubscription,
  StaffSubscription,
  UserSubscription,
} from "./subscriptions";
import { WorkflowsTasksStore } from "./Task/WorkflowsTasksStore";
import {
  EligibilityStatus,
  JusticeInvolvedPerson,
  WorkflowsRouteParams,
} from "./types";
import { staffNameComparator } from "./utils";

type ConstructorOpts = { rootStore: RootStore };

export class WorkflowsStore implements Hydratable {
  rootStore: RootStore;

  opportunityConfigurationStore: OpportunityConfigurationStore;

  private hydrationError?: Error;

  userSubscription: UserSubscription;

  userUpdatesSubscription?: CollectionDocumentSubscription<UserUpdateRecord>;

  private userKeepAliveDisposer?: IDisposer;

  private selectedPersonPseudoId?: string;

  selectedOpportunityType?: OpportunityType;

  selectedOpportunityOnFullProfile?: Opportunity;

  justiceInvolvedPersons: Record<string, JusticeInvolvedPerson> = {};

  officersSubscription: StaffSubscription;

  clientsSubscription: CaseloadSubscription<ClientRecord>;

  residentsSubscription: CaseloadSubscription<ResidentRecord>;

  locationsSubscription: LocationSubscription;

  private formDownloadingFlag = false;

  workflowsTasksStore: WorkflowsTasksStore;

  activeSystem?: SystemId;

  activePage: WorkflowsRouteParams = {};

  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable(this, {
      rootStore: false,
      formatSupervisionLevel: false,
      hydrate: action,
      setActivePage: action,
    });

    this.opportunityConfigurationStore = new OpportunityConfigurationStore(
      this,
    );

    this.officersSubscription = new StaffSubscription(rootStore);
    this.clientsSubscription = new CaseloadSubscription<ClientRecord>(
      this,
      "clients",
      "CLIENT",
    );
    this.residentsSubscription = new CaseloadSubscription<ResidentRecord>(
      this,
      "residents",
      "RESIDENT",
    );
    this.userSubscription = new UserSubscription(rootStore);
    this.locationsSubscription = new LocationSubscription(rootStore);
    // persistent storage for justice-involved persons across subscription changes
    reaction(
      () => [this.caseloadSubscription?.map((s) => s.data).flat()],
      ([newRecords]) => {
        this.updateCaseload(newRecords);
      },
    );

    // clear saved caseload and search when changing tenants, to prevent cross-contamination
    reaction(
      () => [this.rootStore.currentTenantId],
      () => {
        this.updateSelectedSearch([]);
        this.justiceInvolvedPersons = {};
      },
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
      },
    );

    this.workflowsTasksStore = new WorkflowsTasksStore(this);
  }

  hasOpportunities(opportunityTypes: OpportunityType[]): boolean {
    const opportunitiesByTypes = pick(
      this.allOpportunitiesByType,
      opportunityTypes,
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

      this.opportunityConfigurationStore.hydrate();

      this.userSubscription.hydrate();

      // we don't really ever expect the user to change during a session,
      // so to prevent memory leaks we will not overwrite existing subscription objects
      if (!this.userUpdatesSubscription) {
        this.userUpdatesSubscription = new CollectionDocumentSubscription(
          firestoreStore,
          "userUpdates",
          email.toLowerCase(),
        );
      }
      this.userUpdatesSubscription.hydrate();

      this.keepUserObserved();
    } catch (e) {
      this.hydrationError = castToError(e);
    }
  }

  get hydrationState(): HydrationState {
    if (this.hydrationError) {
      return { status: "failed", error: this.hydrationError };
    }
    if (!this.userUpdatesSubscription) {
      const userErr = hydrationFailure(this.userSubscription);

      if (userErr) {
        return { status: "failed", error: userErr };
      }
      return { status: "needs hydration" };
    }

    return compositeHydrationState([
      this.userSubscription,
      this.userUpdatesSubscription,
      this.opportunityConfigurationStore,
    ]);
  }

  disposeUserProfileSubscriptions(): void {
    this.userUpdatesSubscription?.unsubscribe();

    this.userUpdatesSubscription = undefined;
  }

  get user(): CombinedUserRecord | undefined {
    if (!isHydrated(this)) return undefined;

    const [info] = this.userSubscription.data;

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

  /**
   * Prevents the user object (and by extension its underlying subscriptions)
   * from becoming unobserved, to ensure the subscriptions remain active and hydrated
   * even if their data is not being observed.
   *
   * NOTE: This needs to be cleaned up manually when it is no longer needed,
   * to prevent a memory leak from occuring. See `this.stopKeepingUserObserved`.
   */
  keepUserObserved(): void {
    if (!this.userKeepAliveDisposer) {
      this.userKeepAliveDisposer = keepAlive(this, "user");
    }
  }

  /**
   * Disposes of the keepAlive reaction created by `this.keepUserObserved`
   * and resets the state so another keepAlive can be initiated later, if needed.
   */
  stopKeepingUserObserved(): void {
    if (this.userKeepAliveDisposer) {
      this.userKeepAliveDisposer();
      this.userKeepAliveDisposer = undefined;
    }
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
            this.rootStore.currentTenantId,
          )
        : await this.rootStore.firestoreStore.getResident(
            personId,
            this.rootStore.currentTenantId,
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
    PersonClass: typeof Client | typeof Resident,
  ): void {
    const existingPerson = this.justiceInvolvedPersons[record.pseudonymizedId];
    if (existingPerson instanceof PersonClass) {
      existingPerson.updateRecord(record);
    } else {
      set(
        this.justiceInvolvedPersons,
        record.pseudonymizedId,
        new PersonClass(record, this.rootStore),
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
      searchIds,
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

  updateSelectedOpportunityOnFullProfile(opportunity?: Opportunity): void {
    runInAction(() => {
      this.selectedOpportunityOnFullProfile = opportunity;
    });
  }

  get selectedSearchables(): Searchable[] {
    return this.availableSearchables.filter((searchable) =>
      this.selectedSearchIds.includes(searchable.searchId),
    );
  }

  get unsupportedWorkflowSystemsByFeatureVariants(): SystemId[] {
    const {
      featureVariants,
      rootStore: { currentTenantId },
    } = this;

    if (!featureVariants || !currentTenantId) return [];

    const workflowsGatedSystems =
      tenants[currentTenantId]?.workflowsSystemsGatedByFeatureVariant;
    if (!workflowsGatedSystems) return [];

    const featureVariantKeys = new Set(Object.keys(featureVariants));

    // For each `SystemId` that is gated by one or more `FeatureVariant`'s,
    // if `every` of its `systemAllowedFeatureVariant`'s does not
    // appear in the `featureVariantKeys`, acquired from `this` user's `workflowsStore`,
    // then the user does not have a `FeatureVariant` that allows this `SystemId` and
    // therefore the `SystemId` is unsupported.
    return Object.entries(workflowsGatedSystems)
      .filter(([_, systemAllowedFeatureVariants]) =>
        systemAllowedFeatureVariants.every(
          (feature) => !featureVariantKeys.has(feature),
        ),
      )
      .map(([system]) => system as SystemId);
  }

  /** List of supported systems based on the user's permissions. */
  get workflowsSupportedSystems(): SystemId[] | undefined {
    const {
      currentTenantId,
      userStore: { isRecidivizUser },
    } = this.rootStore;

    if (!currentTenantId) return;
    const { workflowsSupportedSystems } = tenants[currentTenantId] ?? [];

    if (isRecidivizUser) {
      return workflowsSupportedSystems;
    }

    const userAllowedSystems: Array<SystemId> = [];
    if (this.rootStore.userStore.getRoutePermission("workflowsSupervision")) {
      userAllowedSystems.push("SUPERVISION");
    }
    if (this.rootStore.userStore.getRoutePermission("workflowsFacilities")) {
      userAllowedSystems.push("INCARCERATION");
    }

    return difference(
      intersection(workflowsSupportedSystems, userAllowedSystems),
      this.unsupportedWorkflowSystemsByFeatureVariants,
    );
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
   * This provides the districts to use for caseload filtering. It returns undefined if the
   * user is enabled to see all districts, or if the user does not have a district to filter by.
   */
  get districtsFilteredBy(): string[] | undefined {
    if (!this.user) return undefined;

    const { filterField, filterValues } =
      this.rootStore.tenantStore.workflowsStaffFilterFn(
        this.user,
        this.rootStore.userStore.activeFeatureVariants,
      ) ?? {};
    if (filterField === "district") {
      return filterValues;
    }
    return undefined;
  }

  get caseloadPersons(): JusticeInvolvedPerson[] {
    const personTypeMatchesActiveSystem = (p: JusticeInvolvedPerson) =>
      this.activeSystem === "ALL" ||
      (this.activeSystem === "INCARCERATION" && p instanceof Resident) ||
      (this.activeSystem === "SUPERVISION" && p instanceof Client);

    return values(this.justiceInvolvedPersons).filter(
      (p) =>
        this.selectedSearchIds.includes(p.searchIdValue) &&
        personTypeMatchesActiveSystem(p),
    );
  }

  get caseloadPersonsSorted(): JusticeInvolvedPerson[] {
    return this.caseloadPersons.sort((a, b) => {
      return (
        ascending(a.fullName.surname, b.fullName.surname) ||
        ascending(a.fullName.givenNames, b.fullName.givenNames)
      );
    });
  }

  get milestonesClients(): Client[] {
    return this.caseloadPersonsSorted.filter((person) => {
      return isClient(person) && person.congratulationsMilestones.length > 0;
    }) as Client[];
  }

  getMilestonesClientsByStatus(
    statuses?: MilestonesMessage["status"][],
  ): Client[] {
    return this.milestonesClients.filter((client) => {
      if (statuses === undefined)
        return client.milestonesMessageStatus === undefined;

      return (
        client.milestonesMessageStatus &&
        statuses.includes(client.milestonesMessageStatus)
      );
    });
  }

  opportunitiesByEligibilityStatus(
    opportunityStatus: EligibilityStatus,
  ): Record<OpportunityType, Opportunity[]> {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    this.opportunityTypes.forEach((opportunityType) => {
      const opportunities = this.caseloadPersonsSorted
        .map((c) => c[opportunityStatus][opportunityType])
        .filter((opp) => opp !== undefined)
        .map((opp) => opp as Opportunity)
        .sort((a: Opportunity, b: Opportunity) => a.compare(b));

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

  get opportunitiesByTab(): Partial<
    Record<OpportunityType, Record<OpportunityTab, Opportunity[]>>
  > {
    return mapValues(this.allOpportunitiesByType, (opps) => {
      return groupBy(opps, "tabTitle") as Record<OpportunityTab, Opportunity[]>;
    });
  }

  opportunitiesLoaded(opportunityTypes: OpportunityType[]): boolean {
    // Wait until we have an active caseload before checking that opportunities are loading.
    if (!this.caseloadLoaded()) return false;

    return (
      this.potentialOpportunities(opportunityTypes).filter(
        (opp) => isHydrationFinished(opp) === false,
      ).length === 0 && this.selectedSearchIds.length > 0
    );
  }

  caseloadLoaded(): boolean {
    return Boolean(
      this.caseloadPersons.length > 0 ||
        this.caseloadSubscription?.every((s) => isHydrated(s)),
    );
  }

  supervisionTasksLoaded(): boolean {
    // Wait until we have an active caseload before checking that tasks are loading.
    if (!this.caseloadLoaded()) return false;
    return this.caseloadPersons.every(
      (person) =>
        person.supervisionTasks && isHydrated(person.supervisionTasks),
    );
  }

  potentialOpportunities(opportunityTypes: OpportunityType[]): Opportunity[] {
    const out: Opportunity[] = [];
    this.caseloadPersons.forEach((person) => {
      opportunityTypes.forEach((oppType) => {
        const opp = person.potentialOpportunities[oppType];
        if (opp) out.push(opp);
      });
    });
    return out;
  }

  get allOpportunitiesByType(): Partial<
    Record<OpportunityType, Opportunity[]>
  > {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    this.opportunityTypes.forEach((opportunityType) => {
      const opportunities = this.caseloadPersonsSorted
        .flatMap((c) => c.verifiedOpportunities[opportunityType] || []) // Flatten and handle undefined entries
        .sort((a, b) => a.compare(b));

      mapping[opportunityType] = opportunities;
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
          (location) => new Location(location),
        );
      }
      case "OFFICER": {
        return this.availableOfficers
          .map((officer) => new Officer(officer))
          .filter((officer) =>
            officer.hasCaseloadForSystemId(this.activeSystem),
          );
      }
      case "CASELOAD": {
        return this.availableOfficers
          .map((officer) => new CaseloadSearchable(officer))
          .filter((officer) =>
            officer.hasCaseloadForSystemId(this.activeSystem),
          );
      }
      case "ALL": {
        const locations = this.availableLocations.map(
          (location) => new Location(location),
        );
        const officers = this.availableOfficers.map(
          (officer) => new Officer(officer),
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
  get featureVariants() {
    return this.rootStore.userStore.activeFeatureVariants;
  }

  /**
   * Opportunity types are ranked in order of how they should display on the Homepage
   */
  get opportunityTypes(): OpportunityType[] {
    const {
      rootStore: { currentTenantId },
      activeSystem,
      featureVariants,
    } = this;
    if (!isHydrated(this) || !currentTenantId || !activeSystem) return [];

    const opportunityTypes = tenants[currentTenantId]?.opportunityTypes ?? [];
    const activeSystemFilters: Record<SystemId, Partial<OpportunityType>[]> = {
      SUPERVISION: SUPERVISION_OPPORTUNITY_TYPES,
      INCARCERATION: INCARCERATION_OPPORTUNITY_TYPES,
      ALL: [], // ALL is a special case where we don't want to filter anything
    };

    return opportunityTypes.filter((oppType: OpportunityType) => {
      const isInSystem =
        activeSystem === "ALL" ||
        activeSystemFilters[activeSystem].includes(oppType);
      if (!isInSystem) return false;

      const { featureVariant, inverseFeatureVariant } =
        OPPORTUNITY_CONFIGS[oppType];
      return (
        (!featureVariant || featureVariants[featureVariant]) &&
        (!inverseFeatureVariant || !featureVariants[inverseFeatureVariant])
      );
    });
  }

  /**
   * Whether or not the loaded caseload has any supervision tasks for the selected officer.
   */
  get hasSupervisionTasks(): boolean {
    return this.caseloadPersons.some((person) => {
      return (
        person.supervisionTasks &&
        isHydrated(person.supervisionTasks) &&
        person.supervisionTasks.tasks.length > 0
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

  get internalSystemName(): string {
    const defaultName = "OMS";
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId) return defaultName;
    return tenants[currentTenantId].internalSystemName ?? defaultName;
  }

  get currentUserEmail(): string {
    const {
      userStore: { userEmail },
    } = this.rootStore;

    return userEmail || "user";
  }

  get currentUserHash(): string {
    const {
      userStore: { userHash },
    } = this.rootStore;
    return userHash;
  }

  setActivePage(params: WorkflowsRouteParams): void {
    set(this.activePage, params);
  }

  get activePageIsHomepage(): boolean {
    return this.activePage.page === this.homepage;
  }
}
