// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { PopulationTimeSeriesChart } from "~shared-pathways";

import { useCoreStore } from "../CoreStoreProvider";
import OverTimeMetric from "../models/OverTimeMetric";
import withPathwaysMetricHelpers from "../PathwaysMetricHelpers/withPathwaysMetricHelpers";

type VizPopulationOverTimeProps = {
  metric: OverTimeMetric;
};

const VizPopulationOverTime: React.FC<VizPopulationOverTimeProps> = ({
  metric,
}) => {
  const { filtersStore } = useCoreStore();
  const { dataSeries, chartTitle } = metric;

  return (
    <PopulationTimeSeriesChart
      metric={metric}
      data={dataSeries}
      title={chartTitle}
      subtitle={filtersStore.filtersDescription}
    />
  );
};

export default withPathwaysMetricHelpers(observer(VizPopulationOverTime));
