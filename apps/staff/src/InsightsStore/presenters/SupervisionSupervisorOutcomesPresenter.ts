// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { ActionStrategyCopy } from "~datatypes";
import { castToError, HydratesFromSource } from "~hydration-utils";

import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { OpportunityConfigurationStore } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionSupervisorPresenter } from "./SupervisionSupervisorPresenter";
import {
  ByMetricAndCategory2DMap,
  ConfigLabels,
  HighlightedOfficersDetail,
  MetricAndOutliersInfo,
  OfficerOutcomesData,
} from "./types";
import {
  getHighlightedOfficersByMetric,
  getOfficerOutcomesData,
} from "./utils";

/**
 * The `SupervisionSupervisorOutcomesPresenter` class is responsible for managing and presenting
 * data related to the outcomes for a given supervisor's officers. It handles data hydration and officer
 * metric data aggregation.
 */
export class SupervisionSupervisorOutcomesPresenter extends SupervisionSupervisorPresenter {
  constructor(
    supervisionStore: InsightsSupervisionStore,
    supervisorPseudoId: string,
    justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    opportunityConfigurationStore: OpportunityConfigurationStore,
  ) {
    super(
      supervisionStore,
      supervisorPseudoId,
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    );

    // TODO (#7050): Change to use only the populate methods related to this presenter.
    this.hydrator = new HydratesFromSource({
      populate: async () => {
        await Promise.all([...this.populateMethods()]);
        await this.populateCaseload();
      },
      expectPopulated: this.expectPopulated(),
    });
  }

  // ==============================
  // Outcomes Info
  // ==============================

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
  // Error Handling and Assertions
  // ==============================

  /**
   * Asserts that officer outcomes have been populated.
   * @throws An error if officer outcomes are not populated.
   */
  protected expectOfficerOutcomesPopulated() {
    if (
      !this.supervisionStore.officersOutcomesBySupervisorPseudoId.has(
        this.supervisorPseudoId,
      )
    )
      throw new Error("failed to populate officers' outcomes");
  }

  // TODO (#7050): Remove this. It now lives in SupervisionSupervisorOutcomesPresenter.ts
  /**
   * Asserts that officers' outcomes data has been populated.
   * @throws The encountered error if outlier data is not populated.
   */
  protected expectOutcomesDataForOutlierOfficersPopulated() {
    if (this.outcomesDataForOutlierOfficersOrError instanceof Error)
      throw this.outcomesDataForOutlierOfficersOrError;
  }

  /**
   * Asserts that metrics have been populated.
   * @throws An error if metrics are not populated.
   */
  protected expectMetricsPopulated() {
    if (this.supervisionStore.metricConfigsById === undefined)
      throw new Error("Failed to populate metrics");
  }

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
}
