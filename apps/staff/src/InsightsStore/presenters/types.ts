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

import { ValuesType } from "utility-types";

import {
  ExcludedSupervisionOfficer,
  InsightsConfig,
  MetricBenchmark,
  MetricConfig,
  OpportunityInfo,
  SupervisionOfficer,
  SupervisionOfficerMetricEvent,
  SupervisionOfficerMetricOutlier,
} from "~datatypes";

import { OpportunityType } from "../../WorkflowsStore/Opportunity";

// This type represents the state of fully hydrated data
// where all necessary related objects are guaranteed to exist
export type OutlierOfficerData<
  T extends SupervisionOfficer | ExcludedSupervisionOfficer,
> = T extends SupervisionOfficer
  ? Omit<SupervisionOfficer, "outlierMetrics"> & {
      outlierMetrics: MetricWithConfig[];
      caseloadCategoryName?: string;
    }
  : T extends ExcludedSupervisionOfficer
    ? Omit<ExcludedSupervisionOfficer, "outlierMetrics"> & {
        outlierMetrics?: MetricWithConfig[];
        caseloadCategoryName?: string;
      }
    : never;

export type MetricWithConfig = SupervisionOfficerMetricOutlier & {
  currentPeriodData: ValuesType<
    SupervisionOfficerMetricOutlier["statusesOverTime"]
  >;
  config: Omit<MetricConfig, "metricBenchmarksByCaseloadCategory">;
  benchmark: MetricBenchmark & { currentPeriodTarget: number };
};

// A officer-agnostic type that combines a metric config with the associated metric benchmark info
export type MetricConfigWithBenchmark = {
  config: ValuesType<InsightsConfig["metrics"]>;
  benchmark: MetricBenchmark & { currentPeriodTarget: number };
};

export type ConfigLabels = Pick<
  InsightsConfig,
  | "supervisionOfficerLabel"
  | "supervisionDistrictLabel"
  | "supervisionDistrictManagerLabel"
  | "supervisionJiiLabel"
  | "supervisorHasNoOutlierOfficersLabel"
  | "officerHasNoOutlierMetricsLabel"
  | "supervisorHasNoOfficersWithEligibleClientsLabel"
  | "officerHasNoEligibleClientsLabel"
  | "supervisionSupervisorLabel"
  | "supervisionUnitLabel"
  | "atOrBelowRateLabel"
  | "atOrAboveRateLabel"
  | "slightlyWorseThanRateLabel"
  | "worseThanRateLabel"
  | "noneAreOutliersLabel"
  | "docLabel"
  | "outliersHover"
>;
export type SupervisionDetails = Pick<
  SupervisionOfficerMetricEvent,
  "supervisionStartDate" | "supervisionType" | "officerAssignmentDate"
>;
export type HighlightedOfficersDetail = {
  metricName: string;
  officerNames: string[];
  topXPct: number | null;
  numOfficers: number;
};

/**
 * All outlier officers for a given metric + caseload category.
 *
 * TODO(#5615): Pare down obsolete data being presented.
 */
export type MetricAndOutliersInfo = {
  metricConfigWithBenchmark: MetricConfigWithBenchmark;
  caseloadCategoryName?: string;
  officersForMetric: OutlierOfficerData<SupervisionOfficer>[];
};

/** Helper type to group information by metric and by caseload category */
export type ByMetricAndCategory2DMap<V> = Map<string, Map<string, V>>;

/**
 * Type for object to hold data before transforming it into `OpportunityInfo`
 */
export type RawOpportunityInfo = OpportunityInfo & {
  homepagePosition: number;
};
export type RawOpportunityInfoByOpportunityType = Map<
  OpportunityType,
  RawOpportunityInfo
>;

/**
 * Type for object to hold the copy for the Action Strategy banner and modal
 */
export type ActionStrategyCopy = {
  prompt: string;
  body: string;
};

export interface PresenterWithHoverManager {
  hoveredOfficerId?: string;
  updateHoveredOfficerId: (officerId: string | undefined) => void;
}
