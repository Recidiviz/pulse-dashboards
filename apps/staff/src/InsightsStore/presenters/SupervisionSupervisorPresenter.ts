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
import { computed, flowResult, makeObservable } from "mobx";

import { castToError, HydratesFromSource, isHydrated } from "~hydration-utils";

import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { Opportunity } from "../../WorkflowsStore/Opportunity";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { OpportunityType } from "../../WorkflowsStore/Opportunity/OpportunityType/types";
import { JusticeInvolvedPerson } from "../../WorkflowsStore/types";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { OpportunityInfo } from "../models/OpportunityInfo";
import {
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
} from "../models/SupervisionOfficer";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { SupervisionOfficerWithOpportunityDetails } from "../models/SupervisionOfficerWithOpportunityDetails";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionBasePresenter } from "./SupervisionBasePresenter";
import {
  ByMetricAndCategory2DMap,
  ConfigLabels,
  MetricAndOutliersInfo,
  OutlierOfficerData,
  RawOpportunityInfo,
  RawOpportunityInfoByOpportunityType,
} from "./types";
import { getOutlierOfficerData } from "./utils";

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

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public supervisorPseudoId: string,
    justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    private opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {
    super(supervisionStore);

    this.justiceInvolvedPersonsStore = justiceInvolvedPersonsStore;
    this.opportunityMapping = "opportunitiesEligible";

    makeObservable<
      SupervisionSupervisorPresenter,
      | "processOfficersAndOpportunities"
      | "buildOpportunitiesDetails"
      | "expectMetricsPopulated"
      | "expectOfficersWithOutliersPopulated"
      | "expectExcludedOfficersPopulated"
      | "expectSupervisorPopulated"
      | "expectOutlierDataPopulated"
      | "populateCaseload"
      | "hydrator"
      | "hydrationState"
    >(
      this,
      {
        expectOutlierDataPopulated: true,
        expectSupervisorPopulated: true,
        expectExcludedOfficersPopulated: true,
        expectOfficersWithOutliersPopulated: true,
        expectMetricsPopulated: true,
        supervisorPseudoId: true,
        outlierOfficersData: computed,
        supervisorInfo: computed,
        timePeriod: computed,
        officersWithOutliersData: computed,
        excludedOfficers: computed,
        allOfficers: computed,
        metricConfigsById: computed,
        supervisorIsCurrentUser: computed,
        userCanAccessAllSupervisors: computed,
        labels: computed,
        outlierOfficersByMetricAndCaseloadCategory: computed,
        expectPopulated: computed,
        populateMethods: computed,
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
      },
      { autoBind: true },
    );

    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([...this.populateMethods]);
        await this.populateCaseload();
      },
      expectPopulated: this.expectPopulated,
    });
  }

  // ==============================
  // Hydration and Initialization
  // ==============================

  /**
   * Returns an array of promises representing the methods required to populate
   * the necessary data for this presenter.
   */
  get populateMethods() {
    return [
      flowResult(this.supervisionStore.populateMetricConfigs()),
      flowResult(
        this.supervisionStore.populateOfficersForSupervisor(
          this.supervisorPseudoId,
        ),
      ),
      flowResult(this.supervisionStore.populateSupervisionOfficerSupervisors()),
      flowResult(
        this.supervisionStore.populateExcludedOfficersForSupervisor(
          this.supervisorPseudoId,
        ),
      ),
      flowResult(this.populateOpportunityConfigurationStore()),
    ];
  }

  /**
   * Returns an array of expectations for whether the necessary data has been populated.
   */
  get expectPopulated() {
    return [
      this.expectMetricsPopulated,
      this.expectOfficersWithOutliersPopulated,
      this.expectExcludedOfficersPopulated,
      this.expectSupervisorPopulated,
      this.expectOutlierDataPopulated,
      this.expectOpportunityConfigurationStorePopulated,
      () =>
        this.expectClientsForOfficersPopulated(
          this.allOfficers.map((o) => o.externalId),
        ),
    ];
  }

  // ==============================
  // Supervision and Officer Data
  // ==============================

  /**
   * Provides information about the currently selected supervisor.
   * @returns The supervisor record, or `undefined` if not yet fetched.
   */
  get supervisorInfo(): SupervisionOfficerSupervisor | undefined {
    return this.supervisionStore.supervisionOfficerSupervisorByPseudoId(
      this.supervisorPseudoId,
    );
  }

  /**
   * Provides outlier officers' data with all necessary relationships fully hydrated.
   * @returns An array of `OutlierOfficerData` or `undefined` if an error occurs.
   */
  get outlierOfficersData():
    | OutlierOfficerData<SupervisionOfficer>[]
    | undefined {
    if (this.outlierDataOrError instanceof Error) {
      return undefined;
    }
    return this.outlierDataOrError;
  }

  /**
   * Provides a list of all officers in this supervisor's unit that were not
   * explicitly excluded from outcomes.
   * @returns An array of `SupervisionOfficer` or `undefined` if data is not available.
   */
  get officersWithOutliersData(): SupervisionOfficer[] | undefined {
    return this.supervisionStore.officersBySupervisorPseudoId.get(
      this.supervisorPseudoId,
    );
  }

  /**
   * Provides a list of all officers excluded from outcomes in this supervisor's unit.
   * @returns An array of `ExcludedSupervisionOfficer` or `undefined` if data is not available.
   */
  get excludedOfficers(): ExcludedSupervisionOfficer[] | undefined {
    return this.supervisionStore.excludedOfficersBySupervisorPseudoId.get(
      this.supervisorPseudoId,
    );
  }

  /**
   * Combines and returns all officers, both included and excluded, under this supervisor.
   * @returns An array of `SupervisionOfficer` and `ExcludedSupervisionOfficer`, or `undefined`.
   */
  get allOfficers(): (SupervisionOfficer | ExcludedSupervisionOfficer)[] {
    return [
      ...(this.officersWithOutliersData || []),
      ...(this.excludedOfficers || []),
    ];
  }

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
   * @private
   * @param {((SupervisionOfficer | ExcludedSupervisionOfficer)[])} allOfficers
   * @return {*}  {RawOpportunityInfoByOpportunityType}
   */
  private processOfficersAndOpportunities(
    allOfficers: (SupervisionOfficer | ExcludedSupervisionOfficer)[],
  ): RawOpportunityInfoByOpportunityType {
    return allOfficers.reduce(
      (
        acc: RawOpportunityInfoByOpportunityType,
        officer: SupervisionOfficer | ExcludedSupervisionOfficer,
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
   * @private
   * @param {RawOpportunityInfoByOpportunityType} rawOpportunityInfoMap
   * @returns {OpportunityInfo[]}
   */
  private buildOpportunitiesDetails(
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
   * @private
   * @param {OpportunityType} opportunityType
   * @returns {RawOpportunityInfo}
   */
  private initializeOpportunityDetail(
    opportunityType: OpportunityType,
  ): RawOpportunityInfo {
    const { homepagePosition, priority, label } =
      this.opportunityConfigurationStore.opportunities[opportunityType];
    return {
      priority,
      label,
      officersWithEligibleClients: [],
      clientsEligibleCount: 0,
      homepagePosition,
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

  // ==============================
  // Error Handling and Assertions
  // ==============================

  /**
   * The outlier data for the `SupervisionOfficerSupervisor`
   * @throws An error if the data is not available.
   * @returns An array of `OutlierOfficerData` or an `Error` object.
   */
  private get outlierDataOrError():
    | OutlierOfficerData<SupervisionOfficer>[]
    | Error {
    try {
      const officersData =
        this.supervisionStore.officersBySupervisorPseudoId.get(
          this.supervisorPseudoId,
        );

      // not expected in practice due to checks above, but needed for type safety
      if (!officersData) {
        throw new Error("Missing expected data for supervised officers");
      }

      return officersData
        .filter((o) => o.outlierMetrics.length > 0)
        .map((o): OutlierOfficerData<SupervisionOfficer> => {
          return getOutlierOfficerData(o, this.supervisionStore);
        });
    } catch (e) {
      return castToError(e);
    }
  }

  /**
   * Internal method to calculate the grouping of outlier officers by metric and caseload category.
   * @returns A 2D map of outlier officers by metric and caseload category, or an `Error` object.
   */
  private get outlierOfficersByMetricAndCaseloadCategoryOrError():
    | ByMetricAndCategory2DMap<MetricAndOutliersInfo>
    | Error {
    try {
      if (!this.outlierOfficersData) {
        throw new Error(
          "Missing expected data for grouping officers by metric",
        );
      }

      const resultMap: ByMetricAndCategory2DMap<MetricAndOutliersInfo> =
        new Map();
      this.outlierOfficersData.forEach((outlierOfficerData) => {
        outlierOfficerData.outlierMetrics.forEach((metric) => {
          const {
            statusesOverTime,
            metricId,
            currentPeriodData,
            ...metricConfigWithBenchmark
          } = metric;
          const caseloadCategoryToOfficers = resultMap.get(metricId);
          if (caseloadCategoryToOfficers) {
            const officersForCaseloadCategory = caseloadCategoryToOfficers.get(
              outlierOfficerData.caseloadCategory,
            );
            if (officersForCaseloadCategory) {
              officersForCaseloadCategory.officersForMetric.push(
                outlierOfficerData,
              );
            } else {
              caseloadCategoryToOfficers.set(
                outlierOfficerData.caseloadCategory,
                {
                  metricConfigWithBenchmark: metricConfigWithBenchmark,
                  caseloadCategoryName: outlierOfficerData.caseloadCategoryName,
                  officersForMetric: [outlierOfficerData],
                },
              );
            }
          } else {
            const caseloadCategoryToOfficers = new Map<
              string,
              MetricAndOutliersInfo
            >();
            caseloadCategoryToOfficers.set(
              outlierOfficerData.caseloadCategory,
              {
                metricConfigWithBenchmark: metricConfigWithBenchmark,
                caseloadCategoryName: outlierOfficerData.caseloadCategoryName,
                officersForMetric: [outlierOfficerData],
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

  /**
   * Asserts that metrics have been populated.
   * @throws An error if metrics are not populated.
   */
  private expectMetricsPopulated() {
    if (this.supervisionStore.metricConfigsById === undefined)
      throw new Error("Failed to populate metrics");
  }

  /**
   * Asserts that officers with outliers have been populated.
   * @throws An error if officers with outliers are not populated.
   */
  private expectOfficersWithOutliersPopulated() {
    if (
      !this.supervisionStore.officersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers with outliers");
  }

  /**
   * Asserts that excluded officers have been populated.
   * @throws An error if excluded officers are not populated.
   */
  private expectExcludedOfficersPopulated() {
    if (
      !this.supervisionStore.excludedOfficersBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate excluded officers");
  }

  /**
   * Asserts that supervisor data has been populated.
   * @throws An error if supervisor data is not populated.
   */
  private expectSupervisorPopulated() {
    if (!this.supervisorInfo) throw new Error("failed to populate supervisor");
  }

  /**
   * Asserts that outlier data has been populated.
   * @throws The encountered error if outlier data is not populated.
   */
  private expectOutlierDataPopulated() {
    if (this.outlierDataOrError instanceof Error) throw this.outlierDataOrError;
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
