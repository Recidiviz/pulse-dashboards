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

import {
  ChartLegendItem,
  FiltersStoreBase,
  NoDataViz,
  PopulationSnapshotChart,
  SnapshotDataPoint,
  SnapshotDataRecord,
  SnapshotMetric,
  SupervisionPopulationSnapshotRecord,
} from "~shared-pathways";

import {
  ADMISSIONS_COLOR,
  chartTitleForEventType,
  EVENT_TYPES,
  EventType,
  RELEASES_COLOR,
} from "../../datastores/eventTypes";
import { useRootStore } from "../StoreProvider";

/** An event type a bar can count. The combined view is not one of them. */
type BarEventType = typeof EVENT_TYPES.ADMISSIONS | typeof EVENT_TYPES.RELEASES;

/**
 * The event types each selection draws, in the order the bars appear within
 * one custody status.
 */
const BAR_EVENT_TYPES: Record<EventType, readonly BarEventType[]> = {
  [EVENT_TYPES.ADMISSIONS]: [EVENT_TYPES.ADMISSIONS],
  [EVENT_TYPES.RELEASES]: [EVENT_TYPES.RELEASES],
  [EVENT_TYPES.ALL]: [EVENT_TYPES.ADMISSIONS, EVENT_TYPES.RELEASES],
};

const BAR_EVENT_TYPE_LABELS: Record<BarEventType, string> = {
  [EVENT_TYPES.ADMISSIONS]: "Admissions",
  [EVENT_TYPES.RELEASES]: "Releases",
};

const BAR_EVENT_TYPE_COLORS: Record<BarEventType, string> = {
  [EVENT_TYPES.ADMISSIONS]: ADMISSIONS_COLOR,
  [EVENT_TYPES.RELEASES]: RELEASES_COLOR,
};

/** One bar, and the record it counts. The two share an index. */
type CustodyStatusBar = {
  record: SnapshotDataRecord;
  point: SnapshotDataPoint;
};

/**
 * Returns one bar for each custody status and event type in view.
 *
 * Custody status is the only breakdown that counts both admissions and
 * releases, so the combined view draws two bars per status. Each of those
 * names its event type and takes that event type's color. A single event type
 * needs neither, so its bars carry the custody status alone.
 *
 * The statuses are ordered by total count, largest first, so the order does
 * not depend on the order the records arrive in.
 */
export function buildCustodyStatusBars(
  records: SnapshotDataRecord[],
  eventType: EventType,
): CustodyStatusBar[] {
  const barEventTypes = BAR_EVENT_TYPES[eventType];
  const eventTypesInView = new Set<string>(barEventTypes);
  const namesEventType = barEventTypes.length > 1;

  const rows = records.filter(
    (record) =>
      record.custodyStatus !== undefined &&
      eventTypesInView.has(record.eventType ?? ""),
  );

  const totalByStatus = new Map<string, number>();
  rows.forEach((record) => {
    const status = record.custodyStatus as string;
    totalByStatus.set(status, (totalByStatus.get(status) ?? 0) + record.count);
  });

  const statuses = [...totalByStatus.entries()]
    .sort(([, aTotal], [, bTotal]) => bTotal - aTotal)
    .map(([status]) => status);

  const bars: CustodyStatusBar[] = [];
  statuses.forEach((status) => {
    barEventTypes.forEach((barEventType) => {
      const record = rows.find(
        (row) => row.custodyStatus === status && row.eventType === barEventType,
      );
      if (!record) return;

      const label = namesEventType
        ? `${status} — ${BAR_EVENT_TYPE_LABELS[barEventType]}`
        : status;

      bars.push({
        record,
        point: {
          index: bars.length,
          accessorValue: status,
          accessorLabel: label,
          tooltipLabel: label,
          value: String(record.count),
          barColor: BAR_EVENT_TYPE_COLORS[barEventType],
        },
      });
    });
  });

  return bars;
}

type Props = {
  metric: SnapshotMetric;
  filtersStore: FiltersStoreBase;
};

const VizCustodyStatusSnapshot: React.FC<Props> = observer(
  function VizCustodyStatusSnapshot({ metric, filtersStore }) {
    const { eventType } = useRootStore();
    const bars = buildCustodyStatusBars(metric.dataSeries, eventType);
    const chartTitle = chartTitleForEventType(metric.content, eventType);
    const legendItems: ChartLegendItem[] = BAR_EVENT_TYPES[eventType].map(
      (barEventType) => ({
        name: BAR_EVENT_TYPE_LABELS[barEventType],
        color: BAR_EVENT_TYPE_COLORS[barEventType],
      }),
    );

    if (bars.every((bar) => bar.point.value === "0")) {
      return (
        <NoDataViz
          title={chartTitle}
          subtitle={filtersStore.filtersDescription}
          latestUpdate={metric.latestUpdateLabel}
        />
      );
    }

    return (
      <PopulationSnapshotChart
        metricId={metric.id}
        data={bars.map((bar) => bar.point)}
        title={chartTitle}
        subtitle={filtersStore.filtersDescription}
        latestUpdate={metric.latestUpdateLabel}
        chartXAxisTitle={metric.chartXAxisTitle}
        accessor={metric.accessor as string}
        isRate={false}
        isHorizontal
        rotateLabels={false}
        isGeographic={false}
        legendItems={legendItems}
        dataSeries={
          bars.map((bar) => bar.record) as SupervisionPopulationSnapshotRecord[]
        }
      />
    );
  },
);

export default VizCustodyStatusSnapshot;
