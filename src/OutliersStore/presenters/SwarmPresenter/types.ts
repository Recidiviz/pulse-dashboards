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

import { TargetStatus } from "../../models/schemaHelpers";
import { MetricWithConfig } from "../types";

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
  chartHeight: number;
  chartLabel: string;
  swarmPoints: SwarmPoint[];
  scaleDomain: ScaleParameter;
  scaleRange: ScaleParameter;
};

export type PrepareFn = (
  metric: MetricWithConfig,
  width: number
) => PreparedChartData;

export type SwarmLayout = {
  prepareChartData: PrepareFn;
};
