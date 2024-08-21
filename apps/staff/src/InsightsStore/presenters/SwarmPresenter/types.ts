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

import { TargetStatus } from "../../models/schemaHelpers";
import { MetricConfigWithBenchmark, MetricWithConfig } from "../types";

export type ScaleParameter = [number, number];

export type InputPoint = {
  position: number;
  radius: number;
  targetStatus: TargetStatus;
  opacity: number;
  highlight?: boolean;
};

export type SwarmPoint = InputPoint & {
  spreadOffset: number;
};

export type PreparedChartData = {
  centerOfContentArea: number;
  chartLabel: string;
  swarmPoints: SwarmPoint[];
  scaleDomain: ScaleParameter;
  scaleRange: ScaleParameter;
  highlightRadius: number;
  backgroundRadius: number;
};

export type PrepareFn = (
  metric: MetricWithConfig,
  width: number,
  height: number,
) => PreparedChartData;

export type PrepareFnV2 = (
  metric: MetricConfigWithBenchmark,
  highlightedDots: HighlightedDot[],
  width: number,
  height: number,
) => PreparedChartData;

export type HighlightedDot = {
  label?: string;
  value: number;
  officerId: string;
  officerPseudoId: string;
  metricId: string;
  labelHidden?: boolean;
  onMouseOver?: React.MouseEventHandler;
};
