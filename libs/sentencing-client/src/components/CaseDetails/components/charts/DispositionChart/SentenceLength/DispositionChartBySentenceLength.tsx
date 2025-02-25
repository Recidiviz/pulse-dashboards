// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useCallback, useMemo, useState } from "react";
import { PieChart } from "react-minimal-pie-chart";

import { Insight } from "../../../../../../api";
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import { getSentenceLengthBucketText } from "../../common/utils";
import * as CommonStyled from "../../components/Styles";

const CHART_HEIGHT = 277;

const OPACITY = 0.3;

type DispositionChartBySentenceLengthProps = {
  dataPoints: NonNullable<Insight>["dispositionData"];
};

export function DispositionChartBySentenceLength({
  dataPoints,
}: DispositionChartBySentenceLengthProps) {
  const [focusedSegment, setFocusedSegment] = useState<number>();

  const formattedDataPoints = useMemo(
    () =>
      dataPoints
        .sort(
          (dataPoint1, dataPoint2) =>
            dataPoint1.sentenceLengthBucketStart -
            dataPoint2.sentenceLengthBucketStart,
        )
        .map((dataPoint) => {
          const {
            recommendationType,
            sentenceLengthBucketStart,
            sentenceLengthBucketEnd,
            percentage,
          } = dataPoint;

          const title = getSentenceLengthBucketText(
            recommendationType,
            sentenceLengthBucketStart,
            sentenceLengthBucketEnd,
          );

          return {
            title,
            value: percentage,
            color: SENTENCE_TYPE_TO_COLOR[title],
          };
        }),
    [dataPoints],
  );

  const recidivismChartLegend = formattedDataPoints.map(({ title, color }) => (
    <CommonStyled.ChartLegendItem key={title}>
      <CommonStyled.ChartLegendDot
        $backgroundColor={color}
      />
      <div>{title}</div>
    </CommonStyled.ChartLegendItem>
  ));

  const getLabel = useCallback(
    ({
      x,
      y,
      dx,
      dy,
      dataEntry,
      dataIndex,
    }: {
      x: number;
      y: number;
      dx: number;
      dy: number;
      dataEntry: { percentage: number };
      dataIndex: number;
    }) => (
      <text
        x={x}
        y={y}
        dx={dx}
        dy={dy}
        dominant-baseline="central"
        text-anchor="middle"
        style={{
          fontSize: "5px",
        }}
        fill="#FFFFFF"
        // If a segment's label is focused, consider the segment focused
        onMouseOver={() => setFocusedSegment(dataIndex)}
        onMouseOut={() => setFocusedSegment(undefined)}
      >
        {`${Math.round(dataEntry.percentage)}%`}
      </text>
    ),
    [setFocusedSegment],
  );

  return (
    <div style={{ height: CHART_HEIGHT }}>
      <PieChart
        data={formattedDataPoints}
        label={getLabel}
        labelStyle={{
          fill: "#FFFFFF",
          fontSize: "0.5em",
        }}
        onMouseOver={(_, index) => {
          setFocusedSegment(index);
        }}
        onMouseOut={() => {
          setFocusedSegment(undefined);
        }}
        // If a segment is focused, we want to dim all of the other segments
        segmentsStyle={(dataIndex) => ({
          opacity:
            focusedSegment === undefined || focusedSegment === dataIndex
              ? undefined
              : OPACITY,
        })}
      />
      <div style={{ marginTop: 35, width: 466 }}>
        <CommonStyled.ChartLegend>
          {recidivismChartLegend}
        </CommonStyled.ChartLegend>
      </div>
    </div>
  );
}
