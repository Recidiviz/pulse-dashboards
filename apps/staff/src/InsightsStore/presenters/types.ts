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

import { ValuesType } from "utility-types";

import { InsightsConfig } from "../models/InsightsConfig";
import { MetricBenchmark } from "../models/MetricBenchmark";
import { MetricConfig } from "../models/MetricConfig";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { SupervisionOfficerMetricOutlier } from "../models/SupervisionOfficerMetricOutlier";

// This type represents the state of fully hydrated data
// where all necessary related objects are guaranteed to exist
export type OutlierOfficerData = Omit<SupervisionOfficer, "outlierMetrics"> & {
  outlierMetrics: MetricWithConfig[];
};
export type MetricWithConfig = SupervisionOfficerMetricOutlier & {
  currentPeriodData: ValuesType<
    SupervisionOfficerMetricOutlier["statusesOverTime"]
  >;
  config: Omit<MetricConfig, "metricBenchmarksByCaseloadType">;
  benchmark: MetricBenchmark & { currentPeriodTarget: number };
};
export type ConfigLabels = Pick<
  InsightsConfig,
  | "supervisionOfficerLabel"
  | "supervisionDistrictLabel"
  | "supervisionDistrictManagerLabel"
  | "supervisionJiiLabel"
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
 * All outlier officers for a given metric, grouped by the outlier metricId.
 */
export type OutlierMetricOfficerGroup = {
  metricId: string;
  officersForMetric: OutlierOfficerData[];
};
