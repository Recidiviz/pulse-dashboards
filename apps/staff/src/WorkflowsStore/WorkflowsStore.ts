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

import assertNever from "assert-never";
import { intersection, pick, sortBy } from "lodash";
import {
  action,
  has,
  makeAutoObservable,
  reaction,
  runInAction,
  set,
  when,
} from "mobx";
import { IDisposer, keepAlive } from "mobx-utils";

import {
  ClientRecord,
  clientRecordSchema,
  IncarcerationStaffRecord,
  incarcerationStaffRecordSchema,
  OpportunityType,
  StaffRecord,
  SupervisionStaffRecord,
  supervisionStaffRecordSchema,
} from "~datatypes";
import {
  castToError,
  compositeHydrationState,
  Hydratable,
  hydrationFailure,
  HydrationState,
  isHydrated,
  isHydrationFinished,
} from "~hydration-utils";

import {
  AnyWorkflowsSystemConfig,
  Searchable,
  SystemId,
} from "../core/models/types";
import { FilterOption } from "../core/types/filters";
import filterOptions, {
  DefaultPopulationFilterOptions,
} from "../core/utils/filterOptions";
import { WorkflowsPage } from "../core/views";
import {
  CombinedUserRecord,
  LocationRecord,
  MilestonesMessage,
  UserMetadata,
  UserUpdateRecord,
  WorkflowsResidentRecord,
} from "../FirestoreStore";
import type { RootStore } from "../RootStore";
import { TENANT_CONFIGS } from "../tenants";
import { Client, isClient, UNKNOWN } from "./Client";
import { Opportunity, OpportunityNotification } from "./Opportunity";
import { OpportunityConfigurationStore } from "./Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { Resident } from "./Resident";
import { SearchStore } from "./SearchStore";
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

  selectedOpportunityId?: string;

  selectedOpportunityType?: OpportunityType;

  selectedOpportunityOnFullProfile?: Opportunity;

  justiceInvolvedPersons: Record<string, JusticeInvolvedPerson> = {};

  incarcerationStaffSubscription: StaffSubscription<
    IncarcerationStaffRecord["output"]
  >;

  supervisionStaffSubscription: StaffSubscription<
    SupervisionStaffRecord["output"]
  >;

  clientsSubscription: CaseloadSubscription<ClientRecord>;

  residentsSubscription: CaseloadSubscription<WorkflowsResidentRecord>;

  locationsSubscription: LocationSubscription;

  private formDownloadingFlag = false;

  workflowsTasksStore: WorkflowsTasksStore;

  searchStore: SearchStore;

  activeSystem?: SystemId;

  activePage: WorkflowsRouteParams = {};

  /**
   * Local state to keep track of the selected search ids for a user with supervised staff,
   * after the default behavior or auto-setting their search ids (to their own + supervised staff) upon login
   */
  selectedSearchIdsForSupervisorsWithStaff: string[] | undefined = undefined;

  /**
   * Local state to keep track of the selected search ids during impersonation mode, since
   * in impersonation mode the user cannot write to firebase
   */
  selectedSearchIdsForImpersonation: string[] | undefined = undefined;

  // TODO(#7061): access tenant config values from the tenant store instead of the global variable
  constructor({ rootStore }: ConstructorOpts) {
    this.rootStore = rootStore;
    makeAutoObservable<this, "userKeepAliveDisposer">(
      this,
      {
        rootStore: false,
        formatSupervisionLevel: false,
        hydrate: action,
        setActivePage: action,
        userKeepAliveDisposer: false,
      },
      { autoBind: true },
    );

    this.opportunityConfigurationStore =
      this.rootStore.workflowsRootStore.opportunityConfigurationStore;

    this.supervisionStaffSubscription = new StaffSubscription(
      rootStore,
      {
        key: "supervisionStaff",
      },
      supervisionStaffRecordSchema,
    );
    this.incarcerationStaffSubscription = new StaffSubscription(
      rootStore,
      {
        key: "incarcerationStaff",
      },
      incarcerationStaffRecordSchema,
    );
    this.clientsSubscription = new CaseloadSubscription<ClientRecord>(
      this,
      { key: "clients" },
      "CLIENT",
      clientRecordSchema,
    );
    this.residentsSubscription =
      new CaseloadSubscription<WorkflowsResidentRecord>(
        this,
        { key: "residents" },
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

    // mirror impersonation selected search with firestore
    reaction(
      () => this.user?.updates?.selectedSearchIds,
      (searchIds?) =>
        (this.selectedSearchIdsForImpersonation = searchIds ?? []),
    );

    // log default caseload search injection, when applicable
    when(
      () => !!this.user,
      () => {
        const { isDefaultOfficerSelection } = this.user?.metadata ?? {};

        if (this.selectedSearchIds && isDefaultOfficerSelection) {
          this.rootStore.analyticsStore.trackCaseloadSearch({
            searchCount: this.selectedSearchIds.length,
            isDefault: true,
            searchType: "OFFICER",
          });
        }
      },
    );

    this.workflowsTasksStore = new WorkflowsTasksStore(this);
    this.searchStore = new SearchStore(this);
  }

  hasOpportunities(opportunityTypes: OpportunityType[]): boolean {
    const opportunitiesByTypes = pick(
      this.allOpportunitiesByType,
      opportunityTypes,
    );
    return (
      this.opportunitiesLoaded() &&
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
          { key: "userUpdates" },
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
      !updates.selectedSearchIds &&
      info.hasCaseload &&
      this.searchStore.searchType === "OFFICER"
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
    if (!this.user) return [];

    const { info } = this.user;

    // return the current user's caseload and staff if current user
    // has at least one staff member they supervise upon login, otherwise
    // use the list updated in `selectedSearchIdsForSupervisorsWithStaff`
    if (this.searchStore.hasSupervisedStaffAndRequiredFeatureVariant) {
      if (this.selectedSearchIdsForSupervisorsWithStaff) {
        return this.selectedSearchIdsForSupervisorsWithStaff;
      }
      const supervisedStaffIds = this.staffSupervisedByCurrentUser.map(
        (staff) => staff.id,
      );
      const currentUserId = info.hasCaseload ? [info.id] : [];
      const staffAndCurrentUserIds = [...currentUserId, ...supervisedStaffIds];
      return staffAndCurrentUserIds;
    }

    if (this.rootStore.isImpersonating) {
      return this.selectedSearchIdsForImpersonation ?? [];
    }

    const previousSearchIds = this.user.updates?.selectedSearchIds;
    return previousSearchIds ?? [];
  }

  private get dismissedOpportunityNotificationIds() {
    return this.user?.updates?.dismissedOpportunityNotificationIds ?? [];
  }

  /**
   * Returns the relevant, undismissed notifications for the given opportunity type.
   */
  activeNotificationsForOpportunityType(
    opportunityType: OpportunityType | undefined,
  ): OpportunityNotification[] | undefined {
    if (!opportunityType) return;

    const { notifications } =
      this.opportunityConfigurationStore.opportunities[opportunityType];
    const dismissedIds = this.dismissedOpportunityNotificationIds;
    return notifications?.filter(({ id }) => !dismissedIds.includes(id));
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

  updatePerson(
    record: WorkflowsResidentRecord,
    PersonClass: typeof Resident,
  ): void;

  updatePerson(record: ClientRecord, PersonClass: typeof Client): void;

  updatePerson(
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

  updateCaseload(
    newPersons: (ClientRecord | WorkflowsResidentRecord)[] = [],
  ): void {
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

    // update the `selectedSearchIdsForSupervisorsWithStaff` for users with staff they supervise
    if (this.searchStore.hasSupervisedStaffAndRequiredFeatureVariant) {
      this.selectedSearchIdsForSupervisorsWithStaff = searchIds;
    }

    this.selectedSearchIdsForImpersonation = searchIds;
  }

  dismissOpportunityNotification(notificationId: string): void {
    if (!this.user) return;

    this.rootStore.firestoreStore.updateDismissedOpportunityNotificationIds(
      this.user.info.email,
      [...this.dismissedOpportunityNotificationIds, notificationId],
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

  updateSelectedOpportunity(opportunityId?: string): void {
    runInAction(() => (this.selectedOpportunityId = opportunityId));
  }

  /**
   * Update the opportunity and person within a mobx transaction so that reactions don't
   * observe the opportunity and person being out of sync. This function should be used
   * instead of calling updateSelectedPerson and updateSelectedOpportunity in sequence.
   */
  async updateSelectedPersonAndOpportunity(opportunity?: Opportunity) {
    const personId = opportunity?.person.pseudonymizedId;
    if (personId && !has(this.justiceInvolvedPersons, personId)) {
      await this.fetchPerson(personId);
    }
    runInAction(() => {
      this.selectedPersonPseudoId = personId;
      this.selectedOpportunityId = opportunity?.selectId;
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
    const allSearchables = this.searchStore.availableSearchables.flatMap(
      (searchableGroup) => searchableGroup.searchables,
    );
    return allSearchables.filter((searchable) =>
      this.selectedSearchIds.includes(searchable.searchId),
    );
  }

  /** List of supported systems based on the user's permissions. */
  get workflowsSupportedSystems(): SystemId[] | undefined {
    const {
      currentTenantId,
      userStore: { isRecidivizUser },
    } = this.rootStore;

    if (!currentTenantId) return;
    const { workflowsSupportedSystems } = TENANT_CONFIGS[currentTenantId] ?? [];

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

    return intersection(workflowsSupportedSystems, userAllowedSystems);
  }

  updateActiveSystem(systemId: SystemId): void {
    runInAction(() => {
      this.activeSystem = systemId;
    });
  }

  get staffSubscription():
    | StaffSubscription<StaffRecord>[]
    | (
        | StaffSubscription<SupervisionStaffRecord["output"]>
        | StaffSubscription<IncarcerationStaffRecord["output"]>
      )[]
    | undefined {
    switch (this.activeSystem) {
      case "INCARCERATION":
        return [this.incarcerationStaffSubscription];
      case "SUPERVISION":
        return [this.supervisionStaffSubscription];
      case "ALL":
        return [
          this.supervisionStaffSubscription,
          this.incarcerationStaffSubscription,
        ];
      case undefined:
        return;
      default:
        assertNever(this.activeSystem);
    }
  }

  get caseloadSubscription():
    | CaseloadSubscription<ClientRecord>[]
    | CaseloadSubscription<WorkflowsResidentRecord>[]
    | (
        | CaseloadSubscription<ClientRecord>
        | CaseloadSubscription<WorkflowsResidentRecord>
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
    return this.searchStore.caseloadPersons;
  }

  get caseloadPersonsSorted(): JusticeInvolvedPerson[] {
    return this.searchStore.caseloadPersonsSorted;
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
    this.opportunityTypes.forEach((opportunityType: OpportunityType) => {
      const opportunities = this.caseloadPersons
        .flatMap(
          (c): Opportunity[] => c[opportunityStatus][opportunityType] || [],
        )
        .sort((a, b) => a.compare(b));

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

  opportunitiesLoaded(): boolean {
    // Wait until we have an active caseload before checking that opportunities are loading.
    if (!this.caseloadLoaded()) return false;

    return (
      this.caseloadPersons.filter(
        (person) => isHydrationFinished(person.opportunityManager) === false,
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

  get allOpportunitiesByType(): Partial<
    Record<OpportunityType, Opportunity[]>
  > {
    const mapping = {} as Record<OpportunityType, Opportunity[]>;
    this.opportunityTypes.forEach((opportunityType) => {
      const opportunities = this.caseloadPersonsSorted
        .flatMap(
          (c) =>
            (c.opportunities[opportunityType] ||
              []) as unknown as Opportunity[],
        ) // Flatten and handle undefined entries
        .sort((a, b) => a.compare(b));

      mapping[opportunityType] = opportunities;
    });
    return mapping;
  }

  get availableOfficers(): StaffRecord[] {
    const officers = (this.staffSubscription ?? []).map((s) => s.data).flat();
    officers.sort(staffNameComparator);
    return officers;
  }

  get availableLocations(): LocationRecord[] {
    const locations = [...this.locationsSubscription.data];
    return sortBy(locations, ["name"]);
  }

  get selectedPerson(): JusticeInvolvedPerson | undefined {
    return this.selectedPersonPseudoId
      ? this.justiceInvolvedPersons[this.selectedPersonPseudoId]
      : undefined;
  }

  get selectedOpportunity(): Opportunity | undefined {
    if (
      !this.selectedOpportunityId ||
      !this.selectedPerson ||
      !this.selectedOpportunityType
    )
      return undefined;

    return this.selectedPerson.opportunities[
      this.selectedOpportunityType
    ]?.find((opp) => opp.selectId === this.selectedOpportunityId);
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
    } = this;
    if (!isHydrated(this) || !currentTenantId || !activeSystem) return [];

    const { opportunities } = this.opportunityConfigurationStore;

    return Object.entries(opportunities)
      .filter(([type, opportunity]) => {
        const isInState = opportunity.stateCode === currentTenantId;
        const isInSystem =
          activeSystem === "ALL" || opportunity?.systemType === activeSystem;

        return isInState && isInSystem && opportunity?.isEnabled;
      })
      .sort(
        ([, a], [, b]) => a.homepagePosition - b.homepagePosition, // sort in ascending order
      )
      .map(([type]) => type as OpportunityType);
  }

  /**
   * Whether the loaded caseload has any supervision tasks for the selected officer.
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
   * Whether this tenant has the supervision tasks feature.
   */
  get allowSupervisionTasks(): boolean {
    const {
      rootStore: { currentTenantId },
    } = this;
    if (!currentTenantId) return false;
    return !!TENANT_CONFIGS[currentTenantId]?.workflowsTasksConfig;
  }

  /**
   * A list of staff supervised by the current user
   */
  get staffSupervisedByCurrentUser(): StaffRecord[] {
    const filteredOfficers = this.availableOfficers.filter(
      (officer) =>
        "supervisorExternalId" in officer &&
        officer.supervisorExternalId === this.user?.info.id,
    );
    return filteredOfficers.sort(staffNameComparator);
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

  // TODO: Make into a label
  /**
   * Title to display for the search bar in workflows
   */
  get workflowsSearchFieldTitle(): string {
    return this.searchStore.searchTitleOverride(this.activeSystem, "officer");
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

  get activeSystemConfig(): AnyWorkflowsSystemConfig | undefined {
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId || !this.activeSystem || this.activeSystem === "ALL") {
      return undefined;
    }

    return this.systemConfigFor(this.activeSystem);
  }

  systemConfigFor(system: Exclude<SystemId, "ALL">): AnyWorkflowsSystemConfig {
    const fallback: AnyWorkflowsSystemConfig = {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "officer",
        },
      ],
    };
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId) return fallback;

    const systemConfig =
      TENANT_CONFIGS[currentTenantId].workflowsSystemConfigs?.[system];

    if (!systemConfig) return fallback;

    // TODO(#7136) - filter down search configs depending on restricted role
    const enabledSearchConfigs = systemConfig.search.filter((search) => {
      return !(
        search.restrictedToFeatureVariant &&
        !this.rootStore.userStore.activeFeatureVariants[
          search.restrictedToFeatureVariant
        ]
      );
    });

    return {
      ...systemConfig,
      search: enabledSearchConfigs,
    } as AnyWorkflowsSystemConfig;
  }

  get homepage(): WorkflowsPage {
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId) return "home";
    return TENANT_CONFIGS[currentTenantId].workflowsHomepage ?? "home";
  }

  get homepageNameOverride(): string | undefined {
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId) return undefined;
    return TENANT_CONFIGS[currentTenantId].workflowsHomepageName;
  }

  get internalSystemName(): string {
    const defaultName = "OMS";
    const { currentTenantId } = this.rootStore;
    if (!currentTenantId) return defaultName;
    return TENANT_CONFIGS[currentTenantId].internalSystemName ?? defaultName;
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
