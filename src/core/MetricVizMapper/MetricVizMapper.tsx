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

import { observer } from "mobx-react-lite";
import React from "react";

import { useCoreStore } from "../CoreStoreProvider";
import LibertyPopulationOverTimeMetric from "../models/LibertyPopulationOverTimeMetric";
import LibertyPopulationSnapshotMetric from "../models/LibertyPopulationSnapshotMetric";
import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";
import PrisonPopulationOverTimeMetric from "../models/PrisonPopulationOverTimeMetric";
import PrisonPopulationPersonLevelMetric from "../models/PrisonPopulationPersonLevelMetric";
import PrisonPopulationSnapshotMetric from "../models/PrisonPopulationSnapshotMetric";
import SupervisionPopulationOverTimeMetric from "../models/SupervisionPopulationOverTimeMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import VizCountOverTimeWithAvg from "../VizCountOverTimeWithAvg";
import VizLengthOfStay from "../VizLengthOfStay";
import VizPopulationOverTime from "../VizPopulationOverTime";
import VizPopulationPersonLevel from "../VizPopulationPersonLevel";
import VizPopulationProjectionOverTime from "../VizPopulationProjectionOverTime";
import VizPopulationSnapshot from "../VizPopulationSnapshot";

const MetricVizMapper: React.FC = () => {
  const { metricsStore } = useCoreStore();
  const metric = metricsStore.current;

  if (metric instanceof PopulationProjectionOverTimeMetric) {
    return <VizPopulationProjectionOverTime metric={metric} />;
  }

  if (
    metric instanceof PrisonPopulationSnapshotMetric ||
    metric instanceof LibertyPopulationSnapshotMetric
  ) {
    return <VizPopulationSnapshot metric={metric} />;
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

  if (metric instanceof PrisonPopulationPersonLevelMetric) {
    return <VizPopulationPersonLevel metric={metric} />;
  }

  if (metric instanceof PrisonPopulationOverTimeMetric) {
    switch (metric.id) {
      case "prisonToSupervisionPopulationOverTime":
        return <VizCountOverTimeWithAvg metric={metric} />;
      default:
        return <VizPopulationOverTime metric={metric} />;
    }
  }

  if (metric instanceof LibertyPopulationOverTimeMetric) {
    return <VizCountOverTimeWithAvg metric={metric} />;
  }

  if (metric instanceof SupervisionPopulationOverTimeMetric) {
    switch (metric.id) {
      case "supervisionPopulationOverTime":
        return <VizPopulationOverTime metric={metric} />;
      default:
        return <VizCountOverTimeWithAvg metric={metric} />;
    }
  }

  // there are no other metric types, so this should only be reached when developing new ones
  throw new Error("unknown metric type");
};

export default observer(MetricVizMapper);
