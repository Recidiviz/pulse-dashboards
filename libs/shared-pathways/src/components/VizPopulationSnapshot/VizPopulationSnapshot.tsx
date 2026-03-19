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
import React, { useEffect, useState } from "react";

import { formatDate } from "~utils";

import { FILTER_TYPES, METRIC_MODES } from "../../constants";
import { Dimension } from "../../dimensions";
import { PopulationFilterLabels } from "../../filters";
import { FiltersStoreBase } from "../../FiltersStoreBase";
import SnapshotMetric from "../../metrics/SnapshotMetric";
import {
  SnapshotDataRecord,
  SupervisionPopulationSnapshotRecord,
} from "../../types";
import { getDimensionLabel, sortByLabel } from "../../utils";
import { PopulationSnapshotChart } from "../PopulationSnapshotChart";
import { SnapshotDataPoint } from "../PopulationSnapshotChart/PopulationSnapshotChart";

type VizPopulationSnapshotProps = {
  metric: SnapshotMetric;
  filtersStore: FiltersStoreBase;
};

const VizPopulationSnapshot: React.FC<VizPopulationSnapshotProps> = ({
  metric,
  filtersStore,
}) => {
  const {
    filters,
    getFilterLabel,
    getFilterLongLabel,
    currentMetricMode,
    filtersDescription,
  } = filtersStore;
  const {
    dataSeries,
    chartTitle,
    accessor,
    chartXAxisTitle,
    enableMetricModeToggle,
    supervisionLevelOrder,
    offenseTypeOrder,
    accessorIsNotFilterType: isNotFilter,
  } = metric;
  const isRate =
    currentMetricMode === METRIC_MODES.RATES && enableMetricModeToggle;
  const isSupervisionLevel = accessor === "supervisionLevel";
  const isOffenseType = accessor === "offenseType";

  const [pickedId, setPickedId] = useState<string[]>([]);

  useEffect(() => {
    if (!isNotFilter) {
      const accessorFilter =
        (filters as Record<string, string[]>)[accessor as string] ?? [];
      setPickedId(accessorFilter);
    } else {
      setPickedId([]);
    }
  }, [filters, accessor, isNotFilter]);

  const data: SnapshotDataPoint[] = dataSeries.map(
    (d: SnapshotDataRecord, index: number) => {
      const accessorValue = String(
        (d as Record<string, unknown>)[accessor as string] ?? "",
      );
      const filterLabel = isNotFilter
        ? accessorValue
        : getFilterLabel(
            accessor as keyof PopulationFilterLabels,
            accessorValue,
          ) ?? accessorValue;
      const filterLongLabel = isNotFilter
        ? getDimensionLabel(accessor as Dimension, accessorValue)
        : getFilterLongLabel(
            accessor as keyof PopulationFilterLabels,
            accessorValue,
          );
      const currentValue = isRate
        ? (d as Record<string, unknown>)["populationProportion"]
        : d.count;
      return {
        index,
        accessorValue,
        accessorLabel: filterLabel,
        tooltipLabel: filterLongLabel || filterLabel,
        value: String(currentValue),
      };
    },
  );

  sortByLabel({
    dataPoints: data,
    labelKey: metric.isHorizontal ? "value" : "accessorLabel",
    desc: metric.isHorizontal,
    valueKey: "accessorValue",
    sortOverride:
      (isSupervisionLevel ? supervisionLevelOrder : undefined) ||
      (isOffenseType ? offenseTypeOrder : undefined),
  });

  const dateInPop = (filters as Record<string, string[]>)[
    FILTER_TYPES.DATE_IN_POPULATION
  ]?.[0];
  const latestUpdate =
    dateInPop && dateInPop !== "ALL"
      ? filtersStore.getFilterLabel(FILTER_TYPES.DATE_IN_POPULATION, dateInPop)
      : formatDate(
          metric.lastUpdated ??
            (dataSeries[0] as SupervisionPopulationSnapshotRecord)?.lastUpdated,
          "MMMM dd, yyyy",
        );

  return (
    <PopulationSnapshotChart
      metricId={metric.id}
      data={data}
      title={chartTitle}
      subtitle={filtersDescription}
      latestUpdate={latestUpdate}
      chartXAxisTitle={chartXAxisTitle}
      accessor={accessor as string}
      isRate={isRate}
      isHorizontal={metric.isHorizontal}
      rotateLabels={metric.rotateLabels}
      isGeographic={metric.isGeographic}
      pickedId={pickedId}
      dataSeries={dataSeries as SupervisionPopulationSnapshotRecord[]}
    />
  );
};

export default observer(VizPopulationSnapshot);
