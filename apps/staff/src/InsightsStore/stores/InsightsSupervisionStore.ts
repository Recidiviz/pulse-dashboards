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
  ClientEvent,
  ClientInfo,
  ExcludedSupervisionOfficer,
  InsightsConfig,
  MetricBenchmark,
  MetricConfig,
  SupervisionOfficer,
  SupervisionOfficerMetricEvent,
  SupervisionOfficerSupervisor,
  UserInfo,
} from "~datatypes";
import { FlowMethod } from "~hydration-utils";

import { formatDate } from "../../utils";
import {
  ActionStrategySurfacedEvent,
  InsightsAPI,
  PatchUserInfoProps,
} from "../api/interface";
import { InsightsStore } from "../InsightsStore";
import { ActionStrategyCopy, ConfigLabels } from "../presenters/types";
import { StringMap2D } from "../types";

export class InsightsSupervisionStore {
  private benchmarksByMetricAndCaseloadCategory?: StringMap2D<MetricBenchmark>;

  actionStrategies?: ActionStrategy;

  userInfo?: UserInfo;

  officersBySupervisorPseudoId: Map<string, SupervisionOfficer[]> = new Map();

  excludedOfficersBySupervisorPseudoId: Map<
    string,
    ExcludedSupervisionOfficer[]
  > = new Map();

  supervisorPseudoId?: string;

  mostRecentSupervisorPseudoId?: string;

  officerPseudoId?: string;

  metricId?: string;

  clientPseudoId?: string;

  outcomeDate?: Date;

  opportunityTypeUrl?: string;

  latestBenchmarksDate?: Date;

  private allSupervisionOfficerSupervisors?: SupervisionOfficerSupervisor[];

  metricEventsByOfficerPseudoIdAndMetricId: StringMap2D<
    Array<SupervisionOfficerMetricEvent>
  > = new Map();

  clientEventsByClientPseudoIdAndOutcomeDate: StringMap2D<Array<ClientEvent>> =
    new Map();

  clientInfoByClientPseudoId: Map<string, ClientInfo> = new Map();

  actionStrategiesEnabled = true;

  constructor(
    public readonly insightsStore: InsightsStore,
    private readonly config: InsightsConfig,
  ) {
    makeAutoObservable<this, "config">(this, {
      // this object will be static so there's no need to deeply observe it
      config: observable.ref,
    });
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
    };
  }

  get isInsightsLanternState(): boolean {
    const { tenantStore } = this.insightsStore.rootStore;
    return tenantStore && tenantStore.insightsLanternState;
  }

  get eventLabels(): string[] {
    return this.config.metrics.map((metric) => metric.eventNameSingular);
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
  ): ActionStrategyCopy | undefined {
    if (pseudoId && this.isActionStrategiesEnabled) {
      switch (this.actionStrategies?.[pseudoId]) {
        case "ACTION_STRATEGY_OUTLIER":
          return {
            prompt: `How might I investigate what is driving this metric?`,
            body: `Try conducting case reviews and direct observations:\n1. Gather additional information on how agents do their work to inform how you approach the staff member, where there are gaps in client or staff resources, and where additional agent training could help.\n2. Conduct case reviews to ascertain whether outlying agents are consistently following agency policy and practice expectations; using the strategies and techniques that have been identified as most effective in meeting agency goals (e.g., evidence-based practices); and delivering services in the manner intended. Consider using cases listed in the tool for the agent's 3 self-assessments/case management reviews this quarter.\n4. Conduct direct observations of in-person staff/client meetings to determine the quality of interactions with clients and how agents are building rapport and using strategies that promote behavior change.\n\nSee this and other action strategies [here](https://drive.google.com/file/d/1M_ZoU3yifj_3-dX19_VYG5fI926kICmA/view?usp=sharing)`,
          };
        case "ACTION_STRATEGY_OUTLIER_3_MONTHS":
          return {
            prompt: `How might I discuss this with the ${this.labels.supervisionOfficerLabel} in a constructive way?`,
            body: `First, investigate: Conduct further case reviews or direct observations along with using the Lantern Insights tool to make sure that you understand the agent's caseload, trends, and approach. Other strategies to better investigate behind the metrics are here.\nAfter investigating, try having a positive meeting 1:1 with the agent:\n1. Establish a meeting atmosphere that fosters open communication. Ensure that your agent comprehends the purpose behind this coaching conversation - improving future client outcomes.\n2. Customize the discussion to cater to the individual needs and growth of the agent you are engaging with.\n3. Utilize positive reinforcement and subtle prompts to demonstrate attentive listening.\n4. Collaborate on generating ideas to reduce outlier metrics and improve overall performance of the officer.\n5. If needed, schedule regular meetings and formulate objectives with clear timeframe expectations to track the progress of the agent or tackle persistent challenges and issues. Consider using cases listed in the tool for the outlying agent's 3 self-assessments/case management reviews this quarter.\n\nSee this and other action strategies [here](https://drive.google.com/file/d/1M_ZoU3yifj_3-dX19_VYG5fI926kICmA/view?usp=sharing).`,
          };
        case "ACTION_STRATEGY_OUTLIER_ABSCONSION":
          return {
            prompt: `What strategies could an ${this.labels.supervisionOfficerLabel} take to reduce their absconder warrant rate?`,
            body: `Try prioritizing rapport-building activities between the agent and the client:\n1. Suggest to this agent that they should prioritize:\n - accommodating client work schedules for meetings\n - building rapport with clients early-on\n - building relationships with community-based providers to connect with struggling clients.\n 2. Implement unit-wide strategies to encourage client engagement, such as:\n - early meaningful contact with all new clients\n - clear explanations of absconding and reengagement to new clients during their orientation and beyond\n - rewarding agents building positive rapport (supportive communication, some amounts of small talk) with clients.\n\nSee more details on this and other action strategies [here](https://drive.google.com/file/d/1M_ZoU3yifj_3-dX19_VYG5fI926kICmA/view?usp=sharing).`,
          };
        case "ACTION_STRATEGY_OUTLIER_NEW_OFFICER":
          return {
            prompt: `How might I help an outlying or new ${this.labels.supervisionOfficerLabel} learn from other agents on my team?`,
            body: `Try pairing agents up to shadow each other on a regular basis:\n1. Identify agents who have a track record of following agency policy, have a growth mindset for their clients, and have a positive rapport with clients.\n 2. Offer outlying agents and/or new agents the opportunity for on-the-job shadowing to learn different approaches, skills, and response techniques when interacting with clients.\n 3. Reinforce the notion among your staff that this presents a valuable opportunity for learning and growth.\n\nSee more details on this and other action strategies [here](https://drive.google.com/file/d/1M_ZoU3yifj_3-dX19_VYG5fI926kICmA/view?usp=sharing).`,
          };
        case "ACTION_STRATEGY_60_PERC_OUTLIERS":
          return {
            prompt: `How might I work with my team to improve these metrics?`,
            body: `Try setting positive, collective goals with your team:\n1. After some investigation, arrange a meeting with your team to engage in a comprehensive discussion about their strengths, challenges, and metrics.\n2. Prepare a well-structured agenda and establish clear objectives for the meeting. Additionally, come prepared with inquiries for your staff, as well as be open to addressing any questions they may have.\n3. Collaborate as a team to brainstorm innovative approaches for overcoming challenges and improving upon any outliers in the metrics.\n4. Establish SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals together with your team for future endeavors and devise a plan to effectively monitor their progress. Ensure that these goals are communicated and easily accessible to all team members.\n5. Foster an environment of open communication and actively encourage the implementation of the strategies and plans that have been established for moving forward.\n\nSee more details on this and other action strategies [here](https://drive.google.com/file/d/1M_ZoU3yifj_3-dX19_VYG5fI926kICmA/view?usp=sharing).`,
          };
        default:
          return undefined;
      }
    }
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
   * Fetches officer and metric data for the specified supervisor
   */
  *populateOfficersForSupervisor(
    supervisorPseudoId: string,
  ): FlowMethod<InsightsAPI["officersForSupervisor"], void> {
    if (this.officersBySupervisorPseudoId.has(supervisorPseudoId)) return;

    const officersData =
      yield this.insightsStore.apiClient.officersForSupervisor(
        supervisorPseudoId,
      );

    if (officersData.length > 0)
      this.officersBySupervisorPseudoId.set(supervisorPseudoId, officersData);
  }

  /**
   * Fetches excluded officer data for the specified supervisor
   */
  *populateExcludedOfficersForSupervisor(
    supervisorPseudoId: string,
  ): FlowMethod<InsightsAPI["excludedOfficersForSupervisor"], void> {
    if (this.excludedOfficersBySupervisorPseudoId.has(supervisorPseudoId))
      return;

    const excludedOfficersData =
      yield this.insightsStore.apiClient.excludedOfficersForSupervisor(
        supervisorPseudoId,
      );

    this.excludedOfficersBySupervisorPseudoId.set(
      supervisorPseudoId,
      excludedOfficersData,
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
  }: {
    pseudoId: string;
  }): void {
    const { userPseudoId } = this.insightsStore.rootStore.userStore;
    const actionStrategy = this.actionStrategies?.[pseudoId];
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
    const { userAppMetadata, isRecidivizUser, isCSGUser } =
      this.insightsStore.rootStore.userStore;

    // Recidiviz and CSG users might not have pseudonymizedIds, but should have an experience
    // similar to leadership users.
    if (isRecidivizUser || isCSGUser) {
      throw new Error("Cannot update user info for Recidiviz or CSG user");
    }

    if (!userAppMetadata) {
      throw new Error("Missing app_metadata for user");
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
}
