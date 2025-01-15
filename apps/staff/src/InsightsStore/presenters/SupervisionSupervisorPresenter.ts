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

import { captureException } from "@sentry/react";
import { ascending, descending } from "d3-array";
import { action, computed, flowResult, makeObservable, observable } from "mobx";
import simplur from "simplur";

import {
  ActionStrategyCopy,
  OpportunityInfo,
  OpportunityType,
  SupervisionOfficer,
  SupervisionOfficerSupervisor,
  SupervisionOfficerWithOpportunityDetails,
} from "~datatypes";
import { castToError, HydratesFromSource, isHydrated } from "~hydration-utils";

import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { Opportunity } from "../../WorkflowsStore/Opportunity";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { JusticeInvolvedPerson } from "../../WorkflowsStore/types";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionBasePresenter } from "./SupervisionBasePresenter";
import {
  ByMetricAndCategory2DMap,
  ConfigLabels,
  HighlightedOfficersDetail,
  MetricAndOutliersInfo,
  OfficerOutcomesData,
  RawOpportunityInfo,
  RawOpportunityInfoByOpportunityType,
} from "./types";
import {
  getHighlightedOfficersByMetric,
  getOfficerOutcomesData,
} from "./utils";

/**
 * The `SupervisionSupervisorPresenter` class is responsible for managing and presenting
 * data related to a supervisor and their supervised officers within the Recidiviz platform.
 * It handles data hydration, supervision data aggregation, metrics computation, and
 * user-specific contextual information.
 *
 * It also extends to provide details about supervision supervisor opportunities.
 */
export class SupervisionSupervisorPresenter extends WithJusticeInvolvedPersonStore(
  SupervisionBasePresenter,
) {
  // ==============================
  // Properties and Constructor
  // ==============================

  protected hydrator: HydratesFromSource;

  _hoveredOfficerId?: string;

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public supervisorPseudoId: string,
    justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    protected opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {
    super(supervisionStore);

    this.justiceInvolvedPersonsStore = justiceInvolvedPersonsStore;
    this.opportunityMapping = "opportunitiesEligible";

    makeObservable<
      SupervisionSupervisorPresenter,
      | "processOfficersAndOpportunities"
      | "buildOpportunitiesDetails"
      | "expectMetricsPopulated"
      | "expectOfficersPopulated"
      | "expectSupervisorPopulated"
      | "expectOutcomesDataForOutlierOfficersPopulated"
      | "expectOfficerOutcomesPopulated"
      | "populateCaseload"
      | "hydrator"
      | "hydrationState"
    >(
      this,
      {
        expectOutcomesDataForOutlierOfficersPopulated: true,
        expectSupervisorPopulated: true,
        expectOfficersPopulated: true,
        expectMetricsPopulated: true,
        expectOfficerOutcomesPopulated: true,
        supervisorPseudoId: true,
        outcomesDataForOutlierOfficers: computed,
        supervisorInfo: computed,
        timePeriod: computed,
        officersWithOutcomesData: computed,
        excludedOfficers: computed,
        allOfficers: computed,
        metricConfigsById: computed,
        supervisorIsCurrentUser: computed,
        userCanAccessAllSupervisors: computed,
        labels: computed,
        outlierOfficersByMetricAndCaseloadCategory: computed,
        expectPopulated: true,
        populateMethods: true,
        _hoveredOfficerId: observable,
        hoveredOfficerId: computed,
        updateHoveredOfficerId: action,
        populateOpportunitiesForOfficers: true,
        populateCaseload: true,
        populateOpportunityConfigurationStore: true,
        expectOpportunityConfigurationStorePopulated: true,
        hydrate: true,
        trackViewed: true,
        hydrator: true,
        hydrationState: true,
        opportunitiesDetails: true,
        processOfficersAndOpportunities: true,
        buildOpportunitiesDetails: true,
        actionStrategyCopy: true,
        disableSurfaceActionStrategies: true,
        setUserHasSeenActionStrategy: true,
      },
      { autoBind: true },
    );

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([...this.populateMethods()]);
        await this.populateCaseload();
      },
      expectPopulated: this.expectPopulated(),
    });
  }

  // ==============================
  // Hydration and Initialization
  // ==============================

  /**
   * Returns an array of promises representing the methods required to populate
   * the necessary data for this presenter.
   */
  populateMethods() {
    return [
      flowResult(this.supervisionStore.populateMetricConfigs()),
      flowResult(
        this.supervisionStore.populateOfficersForSupervisor(
          this.supervisorPseudoId,
        ),
      ),
      flowResult(this.supervisionStore.populateSupervisionOfficerSupervisors()),
      flowResult(this.populateOpportunityConfigurationStore()),
      flowResult(
        this.supervisionStore.populateOutcomesForSupervisor(
          this.supervisorPseudoId,
        ),
      ),
    ];
  }

  /**
   * Returns an array of expectations for whether the necessary data has been populated.
   */
  expectPopulated() {
    return [
      this.expectMetricsPopulated,
      this.expectOfficersPopulated,
      this.expectSupervisorPopulated,
      this.expectOutcomesDataForOutlierOfficersPopulated,
      this.expectOpportunityConfigurationStorePopulated,
      () =>
        this.expectClientsForOfficersPopulated(
          this.allOfficers.map((o) => o.externalId),
        ),
      this.expectOfficerOutcomesPopulated,
    ];
  }

  // ==============================
  // Supervisor and Officer Data
  // ==============================

  /**
   * Provides information about the currently selected supervisor.
   * @returns The supervisor record, or `undefined` if not yet fetched.
   */
  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    return this.supervisionStore.supervisorInfo(this.supervisorPseudoId);
  }

  /**
   * Provides information about the currently selected supervisor's
   * supervision location, whether it is by unit or by district
   */
  get supervisionLocationInfo(): {
    locationLabel: string;
    supervisionLocation?: string | null;
  } {
    return this.supervisionStore.supervisionLocationInfo(
      this.supervisorPseudoId,
    );
  }

  // TODO (#7050): Remove this. It now lives in SupervisionSupervisorOutcomesPresenter.ts
  /**
   * Provides outlier officers' data with all necessary relationships fully hydrated.
   * @returns An array of `OfficerOutcomesData` or `undefined` if an error occurs.
   */
  get outcomesDataForOutlierOfficers(): OfficerOutcomesData[] | undefined {
    if (this.outcomesDataForOutlierOfficersOrError instanceof Error) {
      return undefined;
    }
    return this.outcomesDataForOutlierOfficersOrError;
  }

  /**
   * Provides a list of all officers in this supervisor's unit that were not
   * explicitly excluded from outcomes.
   * @returns An array of `SupervisionOfficer` or `undefined` if data is not available.
   */
  get officersWithOutcomesData(): SupervisionOfficer[] | undefined {
    return this.supervisionStore.officersBySupervisorPseudoId
      .get(this.supervisorPseudoId)
      ?.filter((o) => o.includeInOutcomes === true);
  }

  /**
   * Provides a list of all officers excluded from outcomes in this supervisor's unit.
   * @returns An array of `SupervisionOfficer` or `undefined` if data is not available.
   */
  get excludedOfficers(): SupervisionOfficer[] | undefined {
    return this.supervisionStore.officersBySupervisorPseudoId
      .get(this.supervisorPseudoId)
      ?.filter((o) => o.includeInOutcomes !== true);
  }

  /**
   * Combines and returns all officers, both included and excluded, under this supervisor.
   * @returns An array of `SupervisionOfficer` (empty if data not available).
   */
  get allOfficers(): SupervisionOfficer[] {
    return (
      this.supervisionStore.officersBySupervisorPseudoId.get(
        this.supervisorPseudoId,
      ) ?? []
    );
  }

  // TODO (#7050): Remove this entire section. It now lives in SupervisionSupervisorOutcomesPresenter.ts
  // ==============================
  // Metrics and Labels
  // ==============================

  /**
   * Provides access to all configured metrics by their IDs.
   * @returns A map of metric configurations.
   */
  get metricConfigsById() {
    return this.supervisionStore.metricConfigsById;
  }

  /**
   * Provides configuration labels used within the supervision data.
   * @returns A `ConfigLabels` object.
   */
  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }

  /**
   * Returns all outlier officers of this supervisor, grouped by metric and caseload category.
   * Includes officer-agnostic metric info.
   * @returns A 2D map of outlier officers by metric and caseload category, or `undefined` if an error occurs.
   */
  get outlierOfficersByMetricAndCaseloadCategory():
    | ByMetricAndCategory2DMap<MetricAndOutliersInfo>
    | undefined {
    if (
      this.outlierOfficersByMetricAndCaseloadCategoryOrError instanceof Error
    ) {
      captureException(this.outlierOfficersByMetricAndCaseloadCategoryOrError);
      return undefined;
    }
    return this.outlierOfficersByMetricAndCaseloadCategoryOrError;
  }

  /**
   * Returns officers of this supervisor in the top X percent of officers in the state,
   * grouped by metric.
   * @returns An array of objects containing the metric, top X percent criteria, and info about
   * officers meeting the top X percent criteria.
   */
  get highlightedOfficersByMetric(): HighlightedOfficersDetail[] {
    return getHighlightedOfficersByMetric(
      this.metricConfigsById,
      this.officersWithOutcomesData,
      this.supervisionStore.officersOutcomesBySupervisorPseudoId.get(
        this.supervisorPseudoId,
      ),
    );
  }

  // TODO (#7050): Remove this section. This is now exists in SupervisionSupervisorWorkflowsPresenter.
  // ==============================
  // Opportunity Details
  // ==============================

  /**
   * Provides details about supervision supervisor opportunities.
   * @returns An array of `OpportunityInfo` or `undefined` if workflows are not enabled or data is not available.
   */
  get opportunitiesDetails(): OpportunityInfo[] | undefined {
    if (!this.isWorkflowsEnabled) return;

    const { allOfficers } = this;

    return allOfficers
      ? this.buildOpportunitiesDetails(
          this.processOfficersAndOpportunities(allOfficers),
        )
      : [];
  }

  /**
   * Passthrough to the supervision store
   * Checks if Vitals is enabled based on user permissions.
   * @returns `true` if vitals is enabled, otherwise `false`.
   */
  get isVitalsEnabled() {
    return this.supervisionStore.isVitalsEnabled;
  }

  /**
   * Populates the caseload by getting all officers and populating opportunities for them.
   */
  async populateCaseload() {
    if (!this.isWorkflowsEnabled) return;

    const { allOfficers } = this;
    if (allOfficers) {
      await this.populateOpportunitiesForOfficers(
        allOfficers.map((officer) => officer.externalId),
      );
    }
  }

  /**
   * Populates the opportunity configuration store.
   */
  async populateOpportunityConfigurationStore() {
    this.opportunityConfigurationStore.hydrate();
  }

  /**
   * Processes officers and their clients, creating a map of raw opportunity details.
   *
   * @param {(SupervisionOfficer[])} allOfficers
   * @return {*}  {RawOpportunityInfoByOpportunityType}
   */
  protected processOfficersAndOpportunities(
    allOfficers: SupervisionOfficer[],
  ): RawOpportunityInfoByOpportunityType {
    return allOfficers.reduce(
      (
        acc: RawOpportunityInfoByOpportunityType,
        officer: SupervisionOfficer,
      ) => {
        const opportunitiesByType =
          this.opportunitiesByTypeForOfficer(officer.externalId) ?? {};

        Object.entries<[OpportunityType, Opportunity<JusticeInvolvedPerson>[]]>(
          opportunitiesByType,
        ).forEach(([oppType, opportunities]) => {
          const opportunityType = oppType as OpportunityType;
          const oppDetail =
            acc.get(opportunityType) ??
            this.initializeOpportunityDetail(opportunityType);

          oppDetail.officersWithEligibleClients.push({
            ...officer,
            clientsEligibleCount: opportunities.length,
            clientsEligibleCountWithLabel: simplur`${opportunities.length} ${this.labels.supervisionJiiLabel}[|s]`,
          });
          oppDetail.clientsEligibleCount += opportunities.length;

          acc.set(opportunityType, oppDetail);
        });

        return acc;
      },
      new Map(),
    );
  }

  /**
   * Builds the opportunities details array from raw opportunity info.
   *
   * @param {RawOpportunityInfoByOpportunityType} rawOpportunityInfoMap
   * @returns {OpportunityInfo[]}
   */
  protected buildOpportunitiesDetails(
    rawOpportunityInfoMap: RawOpportunityInfoByOpportunityType,
  ): OpportunityInfo[] {
    return Array.from(rawOpportunityInfoMap.values())
      .toSorted(SupervisionSupervisorPresenter.sortOpportunitiesDetails)
      .map(({ officersWithEligibleClients, homepagePosition, ...rest }) => ({
        ...rest,
        officersWithEligibleClients: officersWithEligibleClients.toSorted(
          SupervisionSupervisorPresenter.sortSupervisionOfficerWithOpportunityDetails,
        ),
      }));
  }

  /**
   * Initializes an opportunity detail object for a given opportunity type.
   *
   * @param {OpportunityType} opportunityType
   * @returns {RawOpportunityInfo}
   */
  protected initializeOpportunityDetail(
    opportunityType: OpportunityType,
  ): RawOpportunityInfo {
    const { homepagePosition, priority, label, zeroGrantsTooltip } =
      this.opportunityConfigurationStore.opportunities[opportunityType];
    return {
      priority,
      label,
      officersWithEligibleClients: [],
      clientsEligibleCount: 0,
      homepagePosition,
      opportunityType,
      zeroGrantsTooltip,
    };
  }

  /**
   * Asserts that the opportunity configuration store has been populated.
   * @throws An error if the store is not hydrated.
   */
  expectOpportunityConfigurationStorePopulated() {
    if (!isHydrated(this.opportunityConfigurationStore))
      throw new Error("Opportunity configuration store not hydrated");
  }

  // TODO (#7050): Remove this entire section. It not lives in SupervisionSupervisorOutcomesPresenter.ts
  // ==============================
  // Action Strategies
  // ==============================

  /**
   * Passthrough to supervisionStore.
   * Provides the Action Strategy copy with prompt and body text
   * @returns an ActionStrategyCopy object
   */
  get actionStrategyCopy(): ActionStrategyCopy[string] | undefined {
    return this.supervisionStore.getActionStrategyCopy(this.supervisorPseudoId);
  }

  /**
   * Passthrough to supervisionStore.
   * Disables Action Strategies so that the banner is not seen
   * again in the current session
   */
  disableSurfaceActionStrategies(): void {
    this.supervisionStore.disableSurfaceActionStrategies();
  }

  /**
   * Passthrough to supervisionStore.
   * When the user has seen an Action Strategy banner,
   * use this to notify the BE of the new surfaced event
   */
  setUserHasSeenActionStrategy(): void {
    this.supervisionStore.setUserHasSeenActionStrategy(this.supervisorPseudoId);
  }

  // ==============================
  // User and Supervisor Context
  // ==============================

  /**
   * Determines if the current supervisor is the logged-in user.
   * @returns `true` if the supervisor is the current user, `false` otherwise.
   */
  get supervisorIsCurrentUser() {
    return (
      this.supervisorPseudoId ===
      this.supervisionStore.currentSupervisorUser?.pseudonymizedId
    );
  }

  /**
   * Checks if the current user has access to all supervisors.
   * @returns `true` if the user can access all supervisors, `false` otherwise.
   */
  get userCanAccessAllSupervisors() {
    return this.supervisionStore.userCanAccessAllSupervisors;
  }

  /**
   * Provides a string with the current time period.
   * @returns The time period string or `undefined` if not available.
   */
  get timePeriod(): string | undefined {
    return this.supervisionStore.benchmarksTimePeriod;
  }

  /**
   * Passthrough to supervisionStore
   * @returns The whether or not the current tenant is a Lantern state
   */
  get isInsightsLanternState(): boolean {
    return this.supervisionStore.isInsightsLanternState;
  }

  get hoveredOfficerId() {
    return this._hoveredOfficerId;
  }

  updateHoveredOfficerId(officerId: string | undefined) {
    this._hoveredOfficerId = officerId;
  }

  // ==============================
  // Error Handling and Assertions
  // ==============================

  // TODO (#7050): Remove this. It now lives in SupervisionSupervisorOutcomesPresenter.ts
  /**
   * The outlier officers' outcomes data for the `SupervisionOfficerSupervisor`
   * @throws An error if the data is not available.
   * @returns An array of `OfficerOutcomesData` or an `Error` object.
   */
  protected get outcomesDataForOutlierOfficersOrError():
    | OfficerOutcomesData[]
    | Error {
    try {
      const outcomesData =
        this.supervisionStore.officersOutcomesBySupervisorPseudoId.get(
          this.supervisorPseudoId,
        );

      // not expected in practice due to checks above, but needed for type safety
      if (!outcomesData) {
        throw new Error(
          "Missing expected outcomes data for supervised officers",
        );
      }
      return outcomesData
        .filter((outcome) => outcome.outlierMetrics.length > 0)
        .map((outcome): OfficerOutcomesData => {
          const officer = this.officersWithOutcomesData?.find(
            (officer) => officer.pseudonymizedId === outcome.pseudonymizedId,
          );
          if (!officer) {
            throw new Error(
              `No officer with outcomes data found for pseudo id: [${outcome.pseudonymizedId}]`,
            );
          }
          return getOfficerOutcomesData(
            officer,
            this.supervisionStore,
            outcome,
          );
        });
    } catch (e) {
      return castToError(e);
    }
  }

  // TODO (#7050): Remove this. It now lives in SupervisionSupervisorOutcomesPresenter.ts
  /**
   * Internal method to calculate the grouping of outlier officers by metric and caseload category.
   * @returns A 2D map of outlier officers by metric and caseload category, or an `Error` object.
   */
  protected get outlierOfficersByMetricAndCaseloadCategoryOrError():
    | ByMetricAndCategory2DMap<MetricAndOutliersInfo>
    | Error {
    try {
      if (!this.outcomesDataForOutlierOfficers) {
        throw new Error(
          "Missing expected data for grouping officers by metric",
        );
      }

      const resultMap: ByMetricAndCategory2DMap<MetricAndOutliersInfo> =
        new Map();
      this.outcomesDataForOutlierOfficers.forEach((officerOutcomesData) => {
        officerOutcomesData.outlierMetrics.forEach((metric) => {
          const {
            statusesOverTime,
            metricId,
            currentPeriodData,
            ...metricConfigWithBenchmark
          } = metric;
          const caseloadCategoryToOfficers = resultMap.get(metricId);
          if (caseloadCategoryToOfficers) {
            const officersForCaseloadCategory = caseloadCategoryToOfficers.get(
              officerOutcomesData.caseloadCategory,
            );
            if (officersForCaseloadCategory) {
              officersForCaseloadCategory.officersForMetric.push(
                officerOutcomesData,
              );
            } else {
              caseloadCategoryToOfficers.set(
                officerOutcomesData.caseloadCategory,
                {
                  metricConfigWithBenchmark: metricConfigWithBenchmark,
                  caseloadCategoryName:
                    officerOutcomesData.caseloadCategoryName,
                  officersForMetric: [officerOutcomesData],
                },
              );
            }
          } else {
            const caseloadCategoryToOfficers = new Map<
              string,
              MetricAndOutliersInfo
            >();
            caseloadCategoryToOfficers.set(
              officerOutcomesData.caseloadCategory,
              {
                metricConfigWithBenchmark: metricConfigWithBenchmark,
                caseloadCategoryName: officerOutcomesData.caseloadCategoryName,
                officersForMetric: [officerOutcomesData],
              },
            );
            resultMap.set(metricId, caseloadCategoryToOfficers);
          }
        });
      });

      return resultMap;
    } catch (e) {
      return castToError(e);
    }
  }

  // TODO (#7050): Remove this. It now lives in SupervisionSupervisorOutcomesPresenter.ts
  /**
   * Asserts that metrics have been populated.
   * @throws An error if metrics are not populated.
   */
  protected expectMetricsPopulated() {
    if (this.supervisionStore.metricConfigsById === undefined)
      throw new Error("Failed to populate metrics");
  }

  /**
   * Asserts that all officers have been populated.
   * @throws An error if all officers are not populated.
   */
  private expectOfficersPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers");
  }

  // TODO (#7050): Remove this. It now lives in SupervisionSupervisorOutcomesPresenter.ts
  /**
   * Asserts that officers with outliers have been populated.
   * @throws An error if officers with outliers are not populated.
   */
  protected expectOfficerOutcomesPopulated() {
    if (
      !this.supervisionStore.officersOutcomesBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers' outcomes");
  }

  /**
   * Asserts that supervisor data has been populated.
   * @throws An error if supervisor data is not populated.
   */
  private expectSupervisorPopulated() {
    if (!this.supervisorInfo) throw new Error("failed to populate supervisor");
  }

  // TODO (#7050): Remove this. It now lives in SupervisionSupervisorOutcomesPresenter.ts
  /**
   * Asserts that outlier officers' data has been populated.
   * @throws The encountered error if outlier data is not populated.
   */
  protected expectOutcomesDataForOutlierOfficersPopulated() {
    if (this.outcomesDataForOutlierOfficersOrError instanceof Error)
      throw this.outcomesDataForOutlierOfficersOrError;
  }

  /**
   * Tracks the event when a supervisor's page is viewed by the user.
   */
  trackViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;
    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsSupervisorPageViewed(
      {
        supervisorPseudonymizedId: this.supervisorPseudoId,
        viewedBy: userPseudoId,
      },
    );
  }

  // ==============================
  // Static Sort Functions
  // ==============================

  /**
   * Static method to sort opportunities details by priority, homepage position, and clients eligible count.
   *
   * @param {RawOpportunityInfo} a - The first opportunity info to compare.
   * @param {RawOpportunityInfo} b - The second opportunity info to compare.
   * @returns The comparison result as a number.
   */
  static sortOpportunitiesDetails(
    a: RawOpportunityInfo,
    b: RawOpportunityInfo,
  ) {
    // HIGH priority opportunityTypes should be first
    if (a.priority !== b.priority) return a.priority === "HIGH" ? -1 : 1;

    // Check homepage position
    if (a.homepagePosition !== b.homepagePosition)
      return ascending(a.homepagePosition, b.homepagePosition);

    // Highest clients eligible count
    if (a.clientsEligibleCount !== b.clientsEligibleCount)
      return descending(a.clientsEligibleCount, b.clientsEligibleCount);

    // Compare by label finally
    return a.label.localeCompare(b.label);
  }

  /**
   * Static method to sort supervision officers with opportunity details by clients eligible count and name.
   *
   * @param {SupervisionOfficerWithOpportunityDetails} a - The first officer to compare.
   * @param {SupervisionOfficerWithOpportunityDetails} b - The second officer to compare.
   * @returns The comparison result as a number.
   */
  static sortSupervisionOfficerWithOpportunityDetails(
    a: SupervisionOfficerWithOpportunityDetails,
    b: SupervisionOfficerWithOpportunityDetails,
  ) {
    const clientsEligibleCompare = descending(
      a.clientsEligibleCount,
      b.clientsEligibleCount,
    );
    // name
    return clientsEligibleCompare !== 0
      ? clientsEligibleCompare
      : a.displayName.localeCompare(b.displayName);
  }
}
