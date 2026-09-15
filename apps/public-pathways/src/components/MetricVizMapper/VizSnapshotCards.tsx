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
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { spacing } from "~design-system";
import {
  FiltersStoreBase,
  SnapshotDataRecord,
  SnapshotMetric,
  VizPopulationSnapshot,
} from "~shared-pathways";

import { MetricVizCard } from "../PathwaysMetricHelpers/withPublicPathwaysMetricHelpers";

const CardStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

/** One card's worth of a section that splits its chart in two. */
export type SnapshotCard = {
  /** The value of the dimension this card covers, e.g. a custody status. */
  value: string;
  records: SnapshotDataRecord[];
};

/**
 * Returns one card per value of `dimension`, in the order the values first
 * appear. A record missing that dimension is left out, since it belongs to no
 * card.
 */
export function splitRecordsIntoCards(
  records: SnapshotDataRecord[],
  dimension: string,
): SnapshotCard[] {
  const cards = new Map<string, SnapshotDataRecord[]>();

  records.forEach((record) => {
    const value = (record as Record<string, unknown>)[dimension];
    if (typeof value !== "string" || !value) return;

    const existing = cards.get(value);
    if (existing) {
      existing.push(record);
    } else {
      cards.set(value, [record]);
    }
  });

  return [...cards].map(([value, cardRecords]) => ({
    value,
    records: cardRecords,
  }));
}

type Props = {
  metric: SnapshotMetric;
  filtersStore: FiltersStoreBase;
  splitDimension: string;
  barColor?: string;
};

/**
 * Draws one chart per value of a dimension, for a section the design splits
 * into several cards.
 */
const VizSnapshotCards: React.FC<Props> = observer(function VizSnapshotCards({
  metric,
  filtersStore,
  splitDimension,
  barColor,
}) {
  const cards = splitRecordsIntoCards(metric.dataSeries, splitDimension);

  // Every record should carry `splitDimension`, so real data can only produce
  // zero cards if the backend stops sending that field. Throwing here — the
  // app's Sentry ErrorBoundary reports it and shows a fallback — beats
  // silently rendering an empty box that looks like a rendering bug rather
  // than a backend contract change.
  if (metric.dataSeries.length > 0 && cards.length === 0) {
    throw new Error(
      `VizSnapshotCards got ${metric.dataSeries.length} record(s) for metric "${metric.id}", but none carried "${splitDimension}". Every card would be blank.`,
    );
  }

  return (
    <CardStack>
      {cards.map(({ value, records }) => (
        <MetricVizCard key={value}>
          <VizPopulationSnapshot
            metric={metric}
            filtersStore={filtersStore}
            records={records}
            title={`${metric.chartTitle} — ${value}`}
            barColor={barColor}
          />
        </MetricVizCard>
      ))}
    </CardStack>
  );
});

export default VizSnapshotCards;
