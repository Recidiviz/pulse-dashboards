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
  InsightsConfig,
  MetricBenchmark,
  MetricConfig,
  OpportunityInfo,
  OpportunityType,
  SupervisionOfficer,
  SupervisionOfficerMetricEvent,
  SupervisionOfficerMetricOutlier,
  SupervisionOfficerOutcomes,
  VitalsMetricForOfficer,
} from "~datatypes";

import { SupervisionTask } from "../../WorkflowsStore";

/**
 * This type represents the combined officer and corresponding outcomes data, where all
 * necessary related objects are guaranteed to exist.
 */
export type OfficerOutcomesData = Omit<
  SupervisionOfficerOutcomes,
  "outlierMetrics"
> &
  SupervisionOfficer & {
    outlierMetrics: MetricWithConfig[];
    caseloadCategoryName?: string;
  };

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
  | "vitalsMetricsMethodologyUrl"
>;
export type SupervisionDetails = Pick<
  SupervisionOfficerMetricEvent,
  "supervisionStartDate" | "supervisionType" | "officerAssignmentDate"
>;

export type SupervisionOfficerIdentifiers = Pick<
  SupervisionOfficer,
  "pseudonymizedId" | "displayName"
>;

export type HighlightedOfficersDetail = {
  metricName: string;
  officers: SupervisionOfficerIdentifiers[];
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
  officersForMetric: OfficerOutcomesData[];
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

export interface PresenterWithHoverManager {
  hoveredOfficerId?: string;
  updateHoveredOfficerId: (officerId: string | undefined) => void;
}

export type VitalsMetricDetailForOfficer = Pick<
  SupervisionOfficer,
  "displayName"
> &
  Pick<VitalsMetricForOfficer, "officerPseudonymizedId" | "metricValue">;

export type SupervisorVitalsMetricDetail = {
  titleDisplayName: string;
  officersWithMetricValues: VitalsMetricDetailForOfficer[];
};

export type OfficerVitalsMetricDetail = VitalsMetricForOfficer & {
  metricId: string;
  titleDisplayName: string;
  bodyDisplayName: string;
  tasks: SupervisionTask[];
};
