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
  AdmissionsAndReleasesOverTimeMetric,
  AdmissionsAndReleasesTimeSeriesRecord,
  FiltersStoreBase,
  getRecordDate,
  PopulationTimeSeriesChart,
  TimeSeriesLine,
} from "~shared-pathways";

import {
  ADMISSIONS_COLOR,
  chartTitleForEventType,
  EVENT_TYPES,
  EventType,
  RELEASES_COLOR,
} from "../../datastores/eventTypes";
import { useRootStore } from "../StoreProvider";

/**
 * Returns the lines to draw for the event type in view: one line per event
 * type the reader asked for, so the combined view draws both.
 */
export function buildEventTypeSeries(
  records: AdmissionsAndReleasesTimeSeriesRecord[],
  eventType: EventType,
): TimeSeriesLine[] {
  const admissions: TimeSeriesLine = {
    name: "Admissions",
    color: ADMISSIONS_COLOR,
    data: records.map((record) => ({
      date: getRecordDate(record),
      value: record.admissionsCount,
    })),
  };

  const releases: TimeSeriesLine = {
    name: "Releases",
    color: RELEASES_COLOR,
    data: records.map((record) => ({
      date: getRecordDate(record),
      value: record.releasesCount,
    })),
  };

  if (eventType === EVENT_TYPES.ADMISSIONS) return [admissions];
  if (eventType === EVENT_TYPES.RELEASES) return [releases];
  return [admissions, releases];
}

type Props = {
  metric: AdmissionsAndReleasesOverTimeMetric;
  filtersStore: FiltersStoreBase;
};

const VizAdmissionsAndReleasesOverTime: React.FC<Props> = observer(
  function VizAdmissionsAndReleasesOverTime({ metric, filtersStore }) {
    const { eventType } = useRootStore();

    return (
      <PopulationTimeSeriesChart
        title={chartTitleForEventType(metric.content, eventType)}
        subtitle={filtersStore.filtersDescription}
        series={buildEventTypeSeries(metric.dataSeries, eventType)}
      />
    );
  },
);

export default VizAdmissionsAndReleasesOverTime;
