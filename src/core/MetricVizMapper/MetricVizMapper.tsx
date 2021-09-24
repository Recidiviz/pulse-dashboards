// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import React from "react";

import PathwaysMetric from "../models/PathwaysMetric";
import PopulationOverTimeMetric from "../models/PopulationOverTimeMetric";
import SupervisionCountOverTimeMetric from "../models/SupervisionCountOverTimeMetric";
import { MetricRecord } from "../models/types";
import VizCountOverTimeWithAvg from "../VizCountOverTimeWithAvg";
import VizPopulationOverTime from "../VizPopulationOverTime";

type MetricVizMapperProps = {
  metric: PathwaysMetric<MetricRecord>;
};

const MetricVizMapper: React.FC<MetricVizMapperProps> = ({ metric }) => {
  if (metric instanceof PopulationOverTimeMetric) {
    return <VizPopulationOverTime metric={metric} />;
  }

  if (metric instanceof SupervisionCountOverTimeMetric) {
    return <VizCountOverTimeWithAvg metric={metric} />;
  }

  // there are no other metric types, so this should only be reached when developing new ones
  throw new Error("unknown metric type");
};

export default MetricVizMapper;
