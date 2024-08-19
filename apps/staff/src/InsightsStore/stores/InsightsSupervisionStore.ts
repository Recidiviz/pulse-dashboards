// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { FlowMethod } from "~hydration-utils";

import { formatDate } from "../../utils";
import { InsightsAPI, PatchUserInfoProps } from "../api/interface";
import { InsightsStore } from "../InsightsStore";
import { ActionStrategy } from "../models/ActionStrategy";
import { ClientEvent } from "../models/ClientEvent";
import { ClientInfo } from "../models/ClientInfo";
import { InsightsConfig } from "../models/InsightsConfig";
import { MetricBenchmark } from "../models/MetricBenchmark";
import { MetricConfig } from "../models/MetricConfig";
import { ActionStrategyCopy } from "../models/offlineFixtures/constants";
import {
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
} from "../models/SupervisionOfficer";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { UserInfo } from "../models/UserInfo";
import { ConfigLabels } from "../presenters/types";
import { StringMap2D } from "../types";

export class InsightsSupervisionStore {
  private benchmarksByMetricAndCaseloadType?: StringMap2D<MetricBenchmark>;

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

  private get allCaseloadTypes(): Set<string> {
    return new Set(
      ...Array.from(
        this.benchmarksByMetricAndCaseloadType?.values() ?? [],
      ).flatMap((b) => b.keys()),
    );
  }

  get areCaseloadTypeBreakdownsEnabled(): boolean {
    return this.allCaseloadTypes.size > 1;
  }

  /**
   * Provides a mapping of all configured metrics, including nested benchmarks data.
   * If undefined, it is still awaiting hydration.
   */
  get metricConfigsById(): Map<string, MetricConfig> | undefined {
    const { benchmarksByMetricAndCaseloadType } = this;
    if (!benchmarksByMetricAndCaseloadType) return;

    return index(
      this.config.metrics.map((m): MetricConfig => {
        const metricBenchmarksByCaseloadType =
          benchmarksByMetricAndCaseloadType.get(m.name);

        return {
          ...m,
          metricBenchmarksByCaseloadType,
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

  getCopyForActionStrategy(
    actionStrategy: string | undefined,
  ): ActionStrategyCopy | undefined {
    switch (actionStrategy) {
      case "ACTION_STRATEGY_OUTLIER":
        return {
          prompt: `How might I investigate what is driving this metric?`,
          body: `<p>Try conducting case reviews and direct observations:</p><ol><li>Gather additional information on how ${this.labels.supervisionOfficerLabel}s do their work to inform how you approach the staff member, where there are gaps in client or staff resources, and where additional ${this.labels.supervisionOfficerLabel} training could help.</li><li>Conduct case reviews to ascertain whether outlying ${this.labels.supervisionOfficerLabel}s are consistently following agency policy and practice expectations; using the strategies and techniques that have been identified as most effective in meeting agency goals (e.g., evidence-based practices); and delivering services in the manner intended. Consider using cases listed in the tool for the ${this.labels.supervisionOfficerLabel}'s 3 self-assessments/case management reviews this quarter.</li><li>Conduct direct observations of in-person staff/client meetings to determine the quality of interactions with clients and how ${this.labels.supervisionOfficerLabel}s are building rapport and using strategies that promote behavior change.</li></ol><p>See this and other action strategies here.</p>`,
        };
      case "ACTION_STRATEGY_OUTLIER_3_MONTHS":
        return {
          prompt: `How might I discuss this with the ${this.labels.supervisionOfficerLabel} in a constructive way?`,
          body: `<p>First, investigate: Conduct further case reviews or direct observations along with using the Lantern Insights tool to make sure that you understand the agent’s caseload, trends, and approach. Other strategies to better investigate behind the metrics are here.<p>After investigating, try having a positive meeting 1:1 with the agent:<ol><li>Establish a meeting atmosphere that fosters open communication. Ensure that your ${this.labels.supervisionOfficerLabel} comprehends the purpose behind this coaching conversation - improving future client outcomes.</li><li>Customize the discussion to cater to the individual needs and growth of the ${this.labels.supervisionOfficerLabel} you are engaging with.</li><li>Utilize positive reinforcement and subtle prompts to demonstrate attentive listening.</li><li>Collaborate on generating ideas to reduce outlier metrics and improve overall performance of the officer.</li><li>If needed, schedule regular meetings and formulate objectives with clear timeframe expectations to track the progress of the ${this.labels.supervisionOfficerLabel} or tackle persistent challenges and issues.</ol><p>See this and other action strategies here.</p>`,
        };
      case "ACTION_STRATEGY_OUTLIER_ABSCONSION":
        return {
          prompt: `What strategies should I as a supervisor in order to reduce a ${this.labels.supervisionOfficerLabel}'s absconder warrant rate?`,
          body: `<p>Try prioritizing rapport-building activities between the ${this.labels.supervisionOfficerLabel} and the client:</p><ol><li style="margin-bottom: 0">Suggest to this agent that they should prioritize:<ol style="list-style-type: lower-alpha; margin-left: 0"><li style="margin-bottom: 0;"">accommodating client work schedules for meetings</li><li style="margin-bottom: 0;">building rapport with clients early-on</li><li style="margin-bottom: 0;">building relationships with community-based providers to connect with struggling clients.</li></ol></li><li>Implement unit-wide strategies to encourage client engagement, such as:<ol style="list-style-type: lower-alpha; margin-left: 0"><li style="margin-bottom:0;">early meaningful contact with all new clients</li><li style="margin-bottom:0;">clear explanations of absconding and reengagement to new clients during their orientation and beyond</li><li style="margin-bottom: 0;">rewarding agents building positive rapport (supportive communication, some amounts of small talk) with clients.</li></ol></ol>See more details on this and other action strategies here.`,
        };
      case "ACTION_STRATEGY_OUTLIER_NEW_OFFICER":
        return {
          prompt: `How might I discuss this with the ${this.labels.supervisionOfficerLabel} in a constructive way?`,
          body: `<p>Try pairing agents up to shadow each other on a regular basis:</p><ol><li>Identify ${this.labels.supervisionOfficerLabel}s who have a track record of following agency policy, have a growth mindset for their clients, and have a positive rapport with clients.</li><li>Offer outlying ${this.labels.supervisionOfficerLabel}s the opportunity for on-the-job shadowing to learn different approaches, skills, and response techniques when interacting with clients.</li><li>Reinforce the notion among your staff that this presents a valuable opportunity for learning and growth.</li></ol><p>See more details on this and other action strategies here.</p>`,
        };
      case "ACTION_STRATEGY_60_PERC_OUTLIERS":
        return {
          prompt: `How might I work with my team to improve these metrics?`,
          body: `<p>Try setting positive, collective goals with your team:</p><ol><li>After some investigation, arrange a meeting with your team to engage in a comprehensive discussion about their strengths, challenges, and metrics.</li><li>Prepare a well-structured agenda and establish clear objectives for the meeting. Additionally, come prepared with inquiries for your staff, as well as be open to addressing any questions they may have.</li><li>Collaborate as a team to brainstorm innovative approaches for overcoming challenges and improving upon any outliers in the metrics.</li><li>Establish SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals together with your team for future endeavors and devise a plan to effectively monitor their progress. Ensure that these goals are communicated and easily accessible to all team members.</li><li>Foster an environment of open communication and actively encourage the implementation of the strategies and plans that have been established for moving forward.</li></ol><p>See more details on this and other action strategies here.</p>`,
        };
      default:
        return undefined;
    }
  }

  get actionStrategyCopy(): ActionStrategyCopy | undefined {
    const { userPseudoId } = this.insightsStore.rootStore.userStore;
    if (userPseudoId) {
      if (
        this.actionStrategies?.[userPseudoId] ===
        "ACTION_STRATEGY_60_PERC_OUTLIERS"
      ) {
        return this.getCopyForActionStrategy(
          "ACTION_STRATEGY_60_PERC_OUTLIERS",
        );
      } else return undefined;
    }
  }

  /**
   * Fetches metric benchmark data for the current tenant.
   *
   * This is a MobX flow method and should be called with mobx.flowResult.
   */
  *populateMetricConfigs(): FlowMethod<InsightsAPI["metricBenchmarks"], void> {
    if (this.benchmarksByMetricAndCaseloadType) return;

    const benchmarks = yield this.insightsStore.apiClient.metricBenchmarks();
    const benchmarksByMetricAndCaseloadType = index(
      benchmarks,
      (b) => b.metricId,
      (b) => b.caseloadType,
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

    this.benchmarksByMetricAndCaseloadType = benchmarksByMetricAndCaseloadType;
    this.latestBenchmarksDate = latestBenchmarksDate;
  }

  *populateActionStrategies(
    supervisorPseudoId: string,
  ): FlowMethod<InsightsAPI["actionStrategies"], void> {
    const { isRecidivizUser, isCSGUser, userPseudoId, activeFeatureVariants } =
      this.insightsStore.rootStore.userStore;

    // set actionStrategies to empty object for non-state users to avoid throwing a hydration error
    if (isRecidivizUser || isCSGUser) {
      this.actionStrategies = {};
      return;
    }

    if (!userPseudoId) {
      throw new Error("Missing pseudonymizedId for user");
    }

    // set actionStrategies to empty object when access requirements aren't met to avoid throwing a hydration error
    if (
      !activeFeatureVariants.actionStrategies ||
      !(userPseudoId === supervisorPseudoId)
    ) {
      this.actionStrategies = {};
      return;
    }

    if (this.actionStrategies) return;

    this.actionStrategies =
      yield this.insightsStore.apiClient.actionStrategies(userPseudoId);
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
