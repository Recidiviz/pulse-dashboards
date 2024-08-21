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

import React from "react";

import OverTimeMetric from "../models/OverTimeMetric";
import PathwaysMetric from "../models/PathwaysMetric";
import PathwaysNewBackendMetric from "../models/PathwaysNewBackendMetric";
import PersonLevelMetric from "../models/PersonLevelMetric";
import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";
import SnapshotMetric from "../models/SnapshotMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import { MetricRecord } from "../models/types";
import VizCountOverTimeWithAvg from "../VizCountOverTimeWithAvg";
import VizLengthOfStay from "../VizLengthOfStay";
import VizPopulationOverTime from "../VizPopulationOverTime";
import VizPopulationPersonLevel from "../VizPopulationPersonLevel";
import VizPopulationProjectionOverTime from "../VizPopulationProjectionOverTime";
import VizPopulationSnapshot from "../VizPopulationSnapshot";

type MetricVizMapperProps = {
  metric: PathwaysMetric<MetricRecord> | PathwaysNewBackendMetric<MetricRecord>;
};

const MetricVizMapper: React.FC<MetricVizMapperProps> = ({ metric }) => {
  if (metric instanceof OverTimeMetric) {
    switch (metric.id) {
      case "prisonPopulationOverTime":
      case "supervisionPopulationOverTime":
        return <VizPopulationOverTime metric={metric} />;
      default:
        return <VizCountOverTimeWithAvg metric={metric} />;
    }
  }

  if (metric instanceof SnapshotMetric) {
    switch (metric.id) {
      case "supervisionToPrisonPopulationByLengthOfStay":
      case "supervisionToLibertyPopulationByLengthOfStay":
        return <VizLengthOfStay metric={metric} />;
      default:
        // Adding "key" here forces React to unmount and remount the component. Without it, when
        // changing pages, there is a brief flash of data before the loading indicator shows up.
        return <VizPopulationSnapshot metric={metric} key={metric.id} />;
    }
  }

  if (metric instanceof PersonLevelMetric) {
    return <VizPopulationPersonLevel metric={metric} />;
  }

  if (metric instanceof PopulationProjectionOverTimeMetric) {
    return <VizPopulationProjectionOverTime metric={metric} />;
  }

  if (metric instanceof SupervisionPopulationSnapshotMetric) {
    switch (metric.id) {
      case "supervisionToPrisonPopulationByLengthOfStay":
      case "supervisionToLibertyPopulationByLengthOfStay":
        return <VizLengthOfStay metric={metric} />;
      default:
        return <VizPopulationSnapshot metric={metric} />;
    }
  }

  // there are no other metric types, so this should only be reached when developing new ones
  throw new Error("unknown metric type");
};

export default MetricVizMapper;
