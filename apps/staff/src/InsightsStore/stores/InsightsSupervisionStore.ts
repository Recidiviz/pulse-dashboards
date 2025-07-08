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

import { index } from "d3-array";
import { parseISO } from "date-fns";
import { uniq } from "lodash";
import { makeAutoObservable, observable } from "mobx";
import moment from "moment";

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import {
  ActionStrategy,
  ActionStrategyCopy,
  ActionStrategyType,
  ClientEvent,
  ClientInfo,
  InsightsConfig,
  MetricBenchmark,
  MetricConfig,
  RosterChangeRequest,
  RosterChangeRequestResponse,
  SupervisionOfficer,
  SupervisionOfficerMetricEvent,
  SupervisionOfficerOutcomes,
  SupervisionOfficerSupervisor,
  SupervisionVitalsMetric,
  UserInfo,
  VitalsMetricForOfficer,
  VitalsMetricId,
} from "~datatypes";
import { FlowMethod } from "~hydration-utils";

import { formatDate } from "../../utils";
import {
  ActionStrategySurfacedEvent,
  InsightsAPI,
  PatchUserInfoProps,
} from "../api/interface";
import { InsightsStore } from "../InsightsStore";
import { ConfigLabels } from "../presenters/types";
import { getLocationWithoutLabel } from "../presenters/utils";
import { StringMap2D } from "../types";

export class InsightsSupervisionStore {
  private benchmarksByMetricAndCaseloadCategory?: StringMap2D<MetricBenchmark>;

  actionStrategies?: ActionStrategy;

  userInfo?: UserInfo;

  officersBySupervisorPseudoId: Map<string, SupervisionOfficer[]> = new Map();

  supervisorPseudoId?: string;

  mostRecentSupervisorPseudoId?: string;

  officerPseudoId?: string;

  metricId?: string;

  clientPseudoId?: string;

  opportunityPseudoId?: string;

  outcomeDate?: Date;

  opportunityTypeUrl?: string;

  latestBenchmarksDate?: Date;

  private allSupervisionOfficerSupervisors?: SupervisionOfficerSupervisor[];

  private allSupervisionOfficers?: SupervisionOfficer[];

  metricEventsByOfficerPseudoIdAndMetricId: StringMap2D<
    Array<SupervisionOfficerMetricEvent>
  > = new Map();

  clientEventsByClientPseudoIdAndOutcomeDate: StringMap2D<Array<ClientEvent>> =
    new Map();

  clientInfoByClientPseudoId: Map<string, ClientInfo> = new Map();

  actionStrategiesEnabled = true;

  vitalsMetricsBySupervisorPseudoId: Map<string, SupervisionVitalsMetric[]> =
    new Map();

  officersOutcomesBySupervisorPseudoId: Map<
    string,
    SupervisionOfficerOutcomes[]
  > = new Map();

  constructor(
    public readonly insightsStore: InsightsStore,
    private readonly config: InsightsConfig,
  ) {
    makeAutoObservable<this, "config">(this, {
      // this object will be static so there's no need to deeply observe it
      config: observable.ref,
    });
  }

  getVitalsMetricConfig(metricId: string) {
    const config = this.config.vitalsMetrics.find(
      (c) => c.metricId === metricId,
    );
    if (!config) {
      throw new Error(`Missing configuration for metric ${metricId}`);
    }
    return config;
  }

  private get allCaseloadCategories(): Set<string> {
    return new Set(
      ...Array.from(
        this.benchmarksByMetricAndCaseloadCategory?.values() ?? [],
      ).flatMap((b) => b.keys()),
    );
  }

  get areCaseloadCategoryBreakdownsEnabled(): boolean {
    return this.allCaseloadCategories.size > 1;
  }

  /**
   * Provides a mapping of all configured metrics, including nested benchmarks data.
   * If undefined, it is still awaiting hydration.
   */
  get metricConfigsById(): Map<string, MetricConfig> | undefined {
    const { benchmarksByMetricAndCaseloadCategory } = this;
    if (!benchmarksByMetricAndCaseloadCategory) return;

    return index(
      this.config.metrics.map((m): MetricConfig => {
        const metricBenchmarksByCaseloadCategory =
          benchmarksByMetricAndCaseloadCategory.get(m.name);

        return {
          ...m,
          metricBenchmarksByCaseloadCategory,
        };
      }),
      (m) => m.name,
    );
  }

  /**
   * Provides a mapping of all configured adverse outcome metrics, including nested benchmarks data.
   */
  get adverseMetricConfigsById(): Map<string, MetricConfig> | undefined {
    if (!this.metricConfigsById) return;

    return new Map(
      Array.from(this.metricConfigsById.entries()).filter(
        ([id, m]) => m.outcomeType === "ADVERSE",
      ),
    );
  }

  get userCanAccessAllSupervisors(): boolean {
    const { userStore } = this.insightsStore.rootStore;
    return userStore.getRoutePermission("supervisors-list");
  }

  get userHasSeenOnboarding(): boolean {
    return this.userInfo?.metadata.hasSeenOnboarding ?? false;
  }

  get userCanSubmitRosterChangeRequest(): boolean {
    return (
      "reportIncorrectRosters" in
        this.insightsStore.rootStore.userStore.activeFeatureVariants &&
      (this.userCanAccessAllSupervisors || !!this.currentSupervisorUser)
    );
  }

  get userCanViewUsageActivity(): boolean {
    return (
      "insightsStaffUsage" in
      this.insightsStore.rootStore.userStore.activeFeatureVariants
    );
  }

  get currentSupervisorUser(): SupervisionOfficerSupervisor | undefined {
    if (this.userInfo?.role === "supervision_officer_supervisor") {
      return this.userInfo.entity;
    }
  }

  get supervisorIsCurrentUser() {
    return (
      !!this.supervisorPseudoId &&
      this.supervisorPseudoId === this.currentSupervisorUser?.pseudonymizedId
    );
  }

  get supervisionOfficerSupervisors():
    | SupervisionOfficerSupervisor[]
    | undefined {
    if (this.userCanAccessAllSupervisors) {
      return this.allSupervisionOfficerSupervisors;
    }
    if (this.currentSupervisorUser) {
      // if the user is a supervisor, the only record they need is their own
      return [this.currentSupervisorUser];
    }
    throw new Error(
      "User is not a supervisor but cannot access all supervisors",
    );
  }

  get supervisionOfficers(): SupervisionOfficer[] | undefined {
    if (this.userCanSubmitRosterChangeRequest)
      return this.allSupervisionOfficers;
    else throw new Error("User cannot access all officers.");
  }

  get benchmarksTimePeriod(): string | undefined {
    if (!this.latestBenchmarksDate) return;

    const latestBenchmarkDateOneYearEarlier = moment(this.latestBenchmarksDate)
      .subtract(1, "year")
      .toDate();

    return `${formatDate(latestBenchmarkDateOneYearEarlier)} - ${formatDate(
      this.latestBenchmarksDate,
    )}`;
  }

  get exclusionReasonDescription(): string {
    return this.config.exclusionReasonDescription;
  }

  get methodologyUrl(): string {
    return this.config.learnMoreUrl;
  }

  get labels(): ConfigLabels {
    return {
      supervisionOfficerLabel: this.config.supervisionOfficerLabel,
      supervisionDistrictLabel: this.config.supervisionDistrictLabel,
      supervisionDistrictManagerLabel:
        this.config.supervisionDistrictManagerLabel,
      supervisionJiiLabel: this.config.supervisionJiiLabel,
      supervisorHasNoOutlierOfficersLabel:
        this.config.supervisorHasNoOutlierOfficersLabel,
      officerHasNoOutlierMetricsLabel:
        this.config.officerHasNoOutlierMetricsLabel,
      supervisorHasNoOfficersWithEligibleClientsLabel:
        this.config.supervisorHasNoOfficersWithEligibleClientsLabel,
      officerHasNoEligibleClientsLabel:
        this.config.officerHasNoEligibleClientsLabel,
      supervisionSupervisorLabel: this.config.supervisionSupervisorLabel,
      supervisionUnitLabel: this.config.supervisionUnitLabel,
      atOrBelowRateLabel: this.config.atOrBelowRateLabel,
      atOrAboveRateLabel: this.config.atOrAboveRateLabel,
      slightlyWorseThanRateLabel: this.config.slightlyWorseThanRateLabel,
      worseThanRateLabel: this.config.worseThanRateLabel,
      noneAreOutliersLabel: this.config.noneAreOutliersLabel,
      docLabel: this.config.docLabel,
      outliersHover: this.config.outliersHover,
      vitalsMetricsMethodologyUrl: this.config.vitalsMetricsMethodologyUrl,
    };
  }

  get isInsightsLanternState(): boolean {
    const { tenantStore } = this.insightsStore.rootStore;
    return tenantStore && tenantStore.insightsLanternState;
  }

  get eventLabels(): string[] {
    return this.config.metrics.map((metric) => metric.eventNameSingular);
  }

  get officerRecord(): SupervisionOfficer | undefined {
    const officer = [...this.officersBySupervisorPseudoId.values()]
      .flat()
      .find((o) => o.pseudonymizedId === this.officerPseudoId);

    return officer;
  }

  get officerOutcomes(): SupervisionOfficerOutcomes | undefined {
    const officerOutcomes = [
      ...this.officersOutcomesBySupervisorPseudoId.values(),
    ]
      .flat()
      .find((o) => o.pseudonymizedId === this.officerPseudoId);

    return officerOutcomes;
  }

  get officerVitalsMetrics(): SupervisionVitalsMetric[] | undefined {
    const officerVitalsMetrics = [
      ...this.vitalsMetricsBySupervisorPseudoId.values(),
    ]
      .flat()
      .map((vitalsMetric) => ({
        metricId: vitalsMetric.metricId,
        vitalsMetrics: vitalsMetric.vitalsMetrics.filter(
          (m) => m.officerPseudonymizedId === this.officerPseudoId,
        ),
      }))
      .filter((vitalsMetric) => vitalsMetric.vitalsMetrics.length > 0);

    // Officers can report to multiple supervisors, so there might be duplicate values returned.
    // Start by grouping all metrics by MetricId, so each MetricId has a single array of vitals
    // metrics.
    const officerVitalsMetricMap = officerVitalsMetrics.reduce<
      Record<VitalsMetricId, VitalsMetricForOfficer[]>
    >(
      (accumulator, currentValue) => ({
        ...accumulator,
        [currentValue.metricId]: [
          ...(accumulator[currentValue.metricId] ?? []),
          ...currentValue.vitalsMetrics,
        ],
      }),
      {} as Record<VitalsMetricId, VitalsMetricForOfficer[]>,
    );

    // Now, check that in cases where there are multiple entries in the array for a single MetricId,
    // that the values all match. If they don't, throw an error. If they do, deduplicate to the
    // first value.
    const officerVitalsMetricsDeduped = Object.entries(
      officerVitalsMetricMap,
    ).map(([metricId, vitalsMetrics]) => {
      if (
        vitalsMetrics.length > 1 &&
        !vitalsMetrics.every(
          (metric) =>
            metric.metricValue === vitalsMetrics[0].metricValue &&
            metric.metric30DDelta === vitalsMetrics[0].metric30DDelta,
        )
      ) {
        throw new Error(
          `Found mismatched metric values for metric ${metricId} for officer pseudo ID ${this.officerPseudoId}`,
        );
      }
      return {
        metricId: metricId as VitalsMetricId,
        vitalsMetrics: vitalsMetrics.slice(0, 1),
      };
    });

    return officerVitalsMetricsDeduped.length > 0
      ? officerVitalsMetricsDeduped
      : undefined;
  }

  get allActionStrategies(): ActionStrategyCopy {
    return this.config.actionStrategyCopy;
  }

  supervisionOfficerSupervisorByExternalId(
    supervisorId: string,
  ): SupervisionOfficerSupervisor | undefined {
    return this.supervisionOfficerSupervisors?.find(
      (s) => s.externalId === supervisorId,
    );
  }

  supervisionOfficerSupervisorByPseudoId(
    supervisorPseudoId: string,
  ): SupervisionOfficerSupervisor | undefined {
    return this.supervisionOfficerSupervisors?.find(
      (s) => s.pseudonymizedId === supervisorPseudoId,
    );
  }

  supervisorInfo(
    supervisorPseudoId: string,
  ): SupervisionOfficerSupervisor | undefined {
    return this.supervisionOfficerSupervisorByPseudoId(supervisorPseudoId);
  }

  supervisionLocationInfo(supervisorPseudoId: string): {
    locationLabel: string;
    supervisionLocationForListPage?: string | null;
    supervisionLocationForSupervisorPage?: string | null;
  } {
    const {
      tenantStore: { insightsUnitState },
    } = this.insightsStore.rootStore;
    const locationLabel = insightsUnitState
      ? this.labels.supervisionUnitLabel
      : this.labels.supervisionDistrictLabel;
    const supervisionLocationForListPage = getLocationWithoutLabel(
      this.supervisorInfo(supervisorPseudoId)?.supervisionLocationForListPage,
      locationLabel,
    );
    const supervisionLocationForSupervisorPage = getLocationWithoutLabel(
      this.supervisorInfo(supervisorPseudoId)
        ?.supervisionLocationForSupervisorPage,
      locationLabel,
    );
    return {
      locationLabel,
      supervisionLocationForListPage,
      supervisionLocationForSupervisorPage,
    };
  }

  private get caseloadCategories() {
    return this.config.caseloadCategories;
  }

  caseloadCategoryDisplayName(categoryId: string) {
    return this.caseloadCategories?.find(
      (categoryConfig) => categoryConfig.id === categoryId,
    )?.displayName;
  }

  /**
   * Indicates whether to surface action strategies (enabled)
   **/
  get isActionStrategiesEnabled(): boolean {
    const { activeFeatureVariants } = this.insightsStore.rootStore.userStore;
    if (!activeFeatureVariants?.actionStrategies) return false;
    return this.actionStrategiesEnabled;
  }

  /**
   * Disables the action strategy banner.
   *
   * There is not a way to re-enable the banner because the user
   * should only ever see a single banner per session. The banner
   * should disappear as soon as the user navigates away from the page.
   */
  disableSurfaceActionStrategies(): void {
    this.actionStrategiesEnabled = false;
  }

  /**
   * When the user has seen an action strategy banner, send a patch request
   * to the BE with a new surfaced event
   */
  setUserHasSeenActionStrategy(pseudoId: string): void {
    const { userPseudoId } = this.insightsStore.rootStore.userStore;

    if (!userPseudoId && !isDemoMode() && !isOfflineMode()) {
      throw new Error(
        "Missing pseudonymizedId for user when marking Action Strategy as surfaced",
      );
    }

    const actionStrategy = this.actionStrategies?.[pseudoId];
    if (!actionStrategy) return;
    const event: ActionStrategySurfacedEvent = {
      userPseudonymizedId: userPseudoId || "RECIDIVIZ",
      officerPseudonymizedId: pseudoId !== userPseudoId ? pseudoId : undefined,
      actionStrategy,
    };
    this.trackActionStrategySurfaced({ userPseudoId, pseudoId });
    this.patchActionStrategiesForCurrentUser(event);
  }

  getActionStrategyCopy(
    pseudoId: string | undefined,
  ): ActionStrategyCopy[string] | undefined {
    if (pseudoId && this.isActionStrategiesEnabled && this.actionStrategies) {
      const actionStrategy = this.actionStrategies[pseudoId];
      return actionStrategy
        ? this.config.actionStrategyCopy[actionStrategy]
        : undefined;
    }
  }

  /**
   * Checks if Vitals is enabled based on user permissions.
   * @returns `true` if vitals is enabled, otherwise `false`.
   */
  get isVitalsEnabled() {
    const { userStore } = this.insightsStore.rootStore;
    return !!userStore.activeFeatureVariants.supervisorHomepageVitals;
  }

  /**
   * Fetches metric benchmark data for the current tenant.
   *
   * This is a MobX flow method and should be called with mobx.flowResult.
   */
  *populateMetricConfigs(): FlowMethod<InsightsAPI["metricBenchmarks"], void> {
    if (this.benchmarksByMetricAndCaseloadCategory) return;

    const benchmarks = yield this.insightsStore.apiClient.metricBenchmarks();
    const benchmarksByMetricAndCaseloadCategory = index(
      benchmarks,
      (b) => b.metricId,
      (b) => b.caseloadCategory,
    );

    const latestBenchmarksDate = new Date(
      Math.max(
        ...uniq(
          benchmarks
            .map((b) => b.benchmarks.map((d) => d.endDate))
            .flat(2)
            .map((d) => d.getTime()),
        ),
      ),
    );

    this.benchmarksByMetricAndCaseloadCategory =
      benchmarksByMetricAndCaseloadCategory;
    this.latestBenchmarksDate = latestBenchmarksDate;
  }

  *populateActionStrategies(): FlowMethod<
    InsightsAPI["actionStrategies"],
    void
  > {
    const {
      isRecidivizUser,
      isCSGUser,
      userPseudoId,
      activeFeatureVariants,
      isImpersonating,
    } = this.insightsStore.rootStore.userStore;
    if (this.actionStrategies) return;

    if (isDemoMode() || isOfflineMode()) {
      // The offline apiClient does not use the userPseudo  Id param so we can pass a dummy param here in demo mode
      this.actionStrategies =
        yield this.insightsStore.apiClient.actionStrategies("demo");
      return;
    }

    // set actionStrategies to empty object for non-state users to avoid throwing a hydration error
    if (!isImpersonating && (isRecidivizUser || isCSGUser)) {
      this.actionStrategies = {};
      return;
    }

    // set actionStrategies to empty object when access requirements aren't met to avoid throwing a hydration error
    if (!activeFeatureVariants.actionStrategies) {
      this.actionStrategies = {};
      return;
    }

    if (!userPseudoId) {
      throw new Error("Missing pseudonymizedId for user");
    }

    this.actionStrategies =
      yield this.insightsStore.apiClient.actionStrategies(userPseudoId);
  }

  /*
   * Updates action strategies with surfaced event
   */
  *patchActionStrategiesForCurrentUser(
    event: ActionStrategySurfacedEvent,
  ): FlowMethod<InsightsAPI["patchActionStrategies"], void> {
    const { userAppMetadata, isRecidivizUser, isCSGUser, isImpersonating } =
      this.insightsStore.rootStore.userStore;

    if (isImpersonating) {
      // eslint-disable-next-line no-console
      console.log(
        `[Impersonation][Action Strategies]: Patching action strategies with event: ${JSON.stringify(event)}`,
      );
      return;
    }

    if (isDemoMode() || isOfflineMode()) {
      // eslint-disable-next-line no-console
      console.log(
        `[Demo/Offline Mode][Action Strategies]: Patching action strategies with event: ${JSON.stringify(event)}`,
      );
      return;
    }

    if (isRecidivizUser || isCSGUser) {
      throw new Error(
        "Cannot update action strategies for Recidiviz or CSG user",
      );
    }

    if (!userAppMetadata) {
      throw new Error("Missing app_metadata for user");
    }

    const { pseudonymizedId } = userAppMetadata;

    if (!pseudonymizedId) {
      throw new Error("Missing pseudonymizedId for user");
    }

    yield this.insightsStore.apiClient.patchActionStrategies(event);
  }

  *populateUserInfo(): FlowMethod<InsightsAPI["userInfo"], void> {
    if (this.userInfo) return;

    const { userAppMetadata, isRecidivizUser, isCSGUser } =
      this.insightsStore.rootStore.userStore;

    // Recidiviz and CSG users might not have pseudonymizedIds, but should have an experience
    // similar to leadership users.
    if (isRecidivizUser || isCSGUser) {
      this.userInfo = {
        entity: null,
        role: null,
        // Recidiviz/CSG users don't need to see the onboarding flow to learn how to use the tool,
        // so hard code that they've already seen it.
        metadata: {
          hasSeenOnboarding: true,
        },
      };
      return;
    }

    if (!userAppMetadata) {
      throw new Error("Missing app_metadata for user");
    }

    const { pseudonymizedId } = userAppMetadata;

    if (!pseudonymizedId) {
      throw new Error("Missing pseudonymizedId for user");
    }
    this.userInfo =
      yield this.insightsStore.apiClient.userInfo(pseudonymizedId);
  }

  /**
   * Fetches supervision officer supervisor data for the current tenant.
   */
  *populateSupervisionOfficerSupervisors(): FlowMethod<
    InsightsAPI["supervisionOfficerSupervisors"],
    void
  > {
    // note that this will bypass hydration if the current user is a supervisor and does not have
    // permission to see all supervisors (since we expect to have already populated this list with
    // their data from /user-info). We expect the API request to fail for these users anyway so
    // there is no reason to let the request proceed
    if (this.supervisionOfficerSupervisors) return;

    this.allSupervisionOfficerSupervisors =
      yield this.insightsStore.apiClient.supervisionOfficerSupervisors();
  }

  /**
   * Fetches officer data for the specified supervisor
   */
  *populateOfficersForSupervisor(
    supervisorPseudoId: string,
  ): FlowMethod<InsightsAPI["officersForSupervisor"], void> {
    if (this.officersBySupervisorPseudoId.has(supervisorPseudoId)) return;

    const officersData =
      yield this.insightsStore.apiClient.officersForSupervisor(
        supervisorPseudoId,
      );

    this.officersBySupervisorPseudoId.set(supervisorPseudoId, officersData);
  }

  /**
   * Fetches all officer data
   */
  *populateAllSupervisionOfficers(): FlowMethod<
    InsightsAPI["allSupervisionOfficers"],
    void
  > {
    if (this.allSupervisionOfficers !== undefined) return;

    this.allSupervisionOfficers =
      yield this.insightsStore.apiClient.allSupervisionOfficers();
  }

  /**
   * Fetches vitals metrics data for the specified supervisor
   */
  *populateVitalsForSupervisor(
    supervisorPseudoId: string,
  ): FlowMethod<InsightsAPI["vitalsForSupervisor"], void> {
    if (this.vitalsMetricsBySupervisorPseudoId.has(supervisorPseudoId)) return;

    const vitalsForSupervisor =
      yield this.insightsStore.apiClient.vitalsForSupervisor(
        supervisorPseudoId,
      );

    this.vitalsMetricsBySupervisorPseudoId.set(
      supervisorPseudoId,
      vitalsForSupervisor,
    );
  }

  /**
   * Fetches officer outcomes data for the specified supervisor
   */
  *populateOutcomesForSupervisor(
    supervisorPseudoId: string,
  ): FlowMethod<InsightsAPI["outcomesForSupervisor"], void> {
    if (this.officersOutcomesBySupervisorPseudoId.has(supervisorPseudoId))
      return;

    const officersOutcomesData =
      yield this.insightsStore.apiClient.outcomesForSupervisor(
        supervisorPseudoId,
      );

    this.officersOutcomesBySupervisorPseudoId.set(
      supervisorPseudoId,
      officersOutcomesData,
    );
  }

  setSupervisorPseudoId(supervisorPseudoId: string | undefined): void {
    this.supervisorPseudoId = supervisorPseudoId;
    if (supervisorPseudoId)
      this.setMostRecentlySelectedSupervisorPseudoId(supervisorPseudoId);
  }

  setMostRecentlySelectedSupervisorPseudoId(
    supervisorPseudoId: string | undefined,
  ): void {
    this.mostRecentSupervisorPseudoId = supervisorPseudoId;
  }

  setOfficerPseudoId(officerPseudoId: string | undefined): void {
    this.officerPseudoId = officerPseudoId;
  }

  setMetricId(metricId: string | undefined): void {
    this.metricId = metricId;
  }

  setClientPseudoId(clientPseudoId: string | undefined): void {
    this.clientPseudoId = clientPseudoId;
  }

  setOpportunityPseudoId(opportunityPseudoId: string | undefined): void {
    this.opportunityPseudoId = opportunityPseudoId;
  }

  setOutcomeDate(dateString: string | undefined): void {
    this.outcomeDate = dateString ? parseISO(dateString) : undefined;
  }

  setOpportunityTypeUrl(opportunityTypeUrl: string | undefined): void {
    this.opportunityTypeUrl = opportunityTypeUrl;
  }

  trackPageViewed30Seconds(path: string): void {
    const { userPseudoId } = this.insightsStore.rootStore.userStore;

    this.insightsStore.rootStore.analyticsStore.trackInsightsPageViewed30Seconds(
      {
        path,
        viewedBy: userPseudoId,
      },
    );
  }

  trackActionStrategyPopupViewed10Seconds({
    pseudoId,
    actionStrategy,
  }: {
    pseudoId?: string;
    actionStrategy: ActionStrategyType | undefined;
  }): void {
    const { userPseudoId } = this.insightsStore.rootStore.userStore;
    if (!actionStrategy) return;

    this.insightsStore.rootStore.analyticsStore.trackInsightsActionStrategyPopupViewed10seconds(
      {
        viewedBy: userPseudoId || "RECIDIVIZ",
        pseudonymizedId: pseudoId,
        actionStrategy,
      },
    );
  }

  trackActionStrategySurfaced({
    userPseudoId = "RECIDIVIZ",
    pseudoId,
  }: {
    userPseudoId?: string;
    pseudoId: string;
  }): void {
    const actionStrategy = this.actionStrategies?.[pseudoId];
    if (actionStrategy)
      this.insightsStore.rootStore.analyticsStore.trackInsightsActionStrategySurfaced(
        {
          viewedBy: userPseudoId,
          pseudonymizedId: pseudoId,
          actionStrategy,
        },
      );
  }

  trackActionStrategyPopupViewed({ pseudoId }: { pseudoId: string }): void {
    const { userPseudoId } = this.insightsStore.rootStore.userStore;

    const actionStrategy = this.actionStrategies?.[pseudoId];
    if (actionStrategy)
      this.insightsStore.rootStore.analyticsStore.trackInsightsActionStrategyPopupViewed(
        {
          viewedBy: userPseudoId,
          pseudonymizedId: pseudoId,
          actionStrategy,
        },
      );
  }

  trackActionStrategyPopupViewedFromList({
    actionStrategy,
  }: {
    actionStrategy: ActionStrategyType;
  }): void {
    const { userPseudoId } = this.insightsStore.rootStore.userStore;

    this.insightsStore.rootStore.analyticsStore.trackInsightsActionStrategyPopupViewedFromList(
      {
        viewedBy: userPseudoId,
        actionStrategy,
      },
    );
  }

  trackActionStrategyListViewed(): void {
    const { userPseudoId } = this.insightsStore.rootStore.userStore;

    this.insightsStore.rootStore.analyticsStore.trackInsightsActionStrategyListViewed(
      {
        viewedBy: userPseudoId,
      },
    );
  }

  /*
   * Fetches events data for the specified officer and metric.
   */
  *populateMetricEventsForOfficer(
    officerPseudoId: string,
    metricId: string,
  ): FlowMethod<InsightsAPI["supervisionOfficerMetricEvents"], void> {
    if (
      this.metricEventsByOfficerPseudoIdAndMetricId
        .get(officerPseudoId)
        ?.has(metricId)
    )
      return;

    const eventsData =
      yield this.insightsStore.apiClient.supervisionOfficerMetricEvents(
        officerPseudoId,
        metricId,
      );

    const metricsMap =
      this.metricEventsByOfficerPseudoIdAndMetricId.get(officerPseudoId) ??
      new Map();
    metricsMap.set(metricId, eventsData);
    if (!this.metricEventsByOfficerPseudoIdAndMetricId.has(officerPseudoId)) {
      this.metricEventsByOfficerPseudoIdAndMetricId.set(
        officerPseudoId,
        metricsMap,
      );
    }
  }

  /*
   * Fetches events specified client and outcome date.
   */
  *populateClientEventsForClient(
    clientPseudoId: string,
    outcomeDate: Date,
  ): FlowMethod<InsightsAPI["clientEvents"], void> {
    if (
      this.clientEventsByClientPseudoIdAndOutcomeDate
        .get(clientPseudoId)
        ?.has(outcomeDate.toISOString())
    )
      return;

    const clientEventsData = yield this.insightsStore.apiClient.clientEvents(
      clientPseudoId,
      outcomeDate,
    );

    const metricsMap =
      this.clientEventsByClientPseudoIdAndOutcomeDate.get(clientPseudoId) ??
      new Map();
    metricsMap.set(outcomeDate.toISOString(), clientEventsData);
    if (!this.clientEventsByClientPseudoIdAndOutcomeDate.has(clientPseudoId)) {
      this.clientEventsByClientPseudoIdAndOutcomeDate.set(
        clientPseudoId,
        metricsMap,
      );
    }
  }

  /*
   * Fetches profile info for  specified client.
   */
  *populateClientInfoForClient(
    clientPseudoId: string,
  ): FlowMethod<InsightsAPI["clientInfo"], void> {
    if (this.clientInfoByClientPseudoId.get(clientPseudoId)) return;

    const clientInfo =
      yield this.insightsStore.apiClient.clientInfo(clientPseudoId);

    this.clientInfoByClientPseudoId.set(clientPseudoId, clientInfo);
  }

  /*
   * Updates user info for specified user.
   */
  *patchUserInfoForCurrentUser(
    props: PatchUserInfoProps,
  ): FlowMethod<InsightsAPI["patchUserInfo"], void> {
    const { userAppMetadata, isRecidivizUser, isCSGUser, isImpersonating } =
      this.insightsStore.rootStore.userStore;

    // Recidiviz and CSG users might not have pseudonymizedIds, but should have an experience
    // similar to leadership users.
    if (isRecidivizUser || isCSGUser) {
      throw new Error("Cannot update user info for Recidiviz or CSG user");
    }

    if (!userAppMetadata) {
      throw new Error("Missing app_metadata for user");
    }

    if (isImpersonating && this.userInfo) {
      this.userInfo.metadata = {
        ...this.userInfo.metadata,
        ...props,
      };
      return;
    }

    const { pseudonymizedId } = userAppMetadata;

    if (!pseudonymizedId) {
      throw new Error("Missing pseudonymizedId for user");
    }
    this.userInfo = yield this.insightsStore.apiClient.patchUserInfo(
      pseudonymizedId,
      props,
    );
  }

  /**
   * Submits a request to the backend to create an Intercom ticket
   * requesting to make roster addition(s) or removal(s) for a supervisors's caseload.
   * @returns API Response if the status is OK, an error otherwise.
   */
  *submitRosterChangeRequestIntercomTicket(
    targetSupervisorPseudoId: string,
    props: Omit<RosterChangeRequest, "requesterName">,
  ): FlowMethod<
    InsightsAPI["submitRosterChangeRequestIntercomTicket"],
    RosterChangeRequestResponse
  > {
    if (!this.userCanSubmitRosterChangeRequest)
      throw new Error(
        "You do not have permission to submit a roster change request.",
      );

    const requesterName = this.insightsStore.rootStore.user?.name;

    if (requesterName === undefined)
      throw new Error("User's name could not be found to submit request.");

    const response =
      yield this.insightsStore.apiClient.submitRosterChangeRequestIntercomTicket(
        targetSupervisorPseudoId,
        {
          ...props,
          requesterName,
        },
      );

    return response;
  }
}
