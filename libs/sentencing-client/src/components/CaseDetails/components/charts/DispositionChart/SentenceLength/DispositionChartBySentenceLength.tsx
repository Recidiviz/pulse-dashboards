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

import { useMemo, useState } from "react";
import { PieChart } from "react-minimal-pie-chart";

import { Insight } from "../../../../../../api";
import * as CommonStyled from "../../components/Styles";

const COLORS: Record<string, string> = {
  "< 1 Year": "#25636F",
  "1-2 Years": "#D9A95F",
  "3-5 Years": "#BA4F4F",
  "11-20 Years": "#4C6290",
  "21+ Years": "#90AEB5",
};

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
            sentenceLengthBucketStart,
            sentenceLengthBucketEnd,
            percentage,
          } = dataPoint;

          let range: string;
          // Format the string to account for ranges starting with 0 and ending with -1
          if (sentenceLengthBucketStart === 0) {
            // If the range ends with 1 year, we want to display it as "< 1 Year"
            range = `< ${sentenceLengthBucketEnd} Year${sentenceLengthBucketEnd > 1 ? "s" : ""}`;
          } else if (sentenceLengthBucketEnd === -1) {
            range = `${sentenceLengthBucketStart}+ Years`;
          } else {
            range = `${sentenceLengthBucketStart}-${sentenceLengthBucketEnd} Years`;
          }

          return {
            title: range,
            value: percentage,
            color: COLORS[range],
          };
        }),
    [dataPoints],
  );

  const recidivismChartLegend = formattedDataPoints.map(({ title }) => (
    <CommonStyled.ChartLegendItem key={title}>
      <CommonStyled.ChartLegendDot $backgroundColor={COLORS[title]} />
      <div>{title}</div>
    </CommonStyled.ChartLegendItem>
  ));

  return (
    <div style={{ height: CHART_HEIGHT }}>
      <PieChart
        data={formattedDataPoints}
        label={({ x, y, dx, dy, dataEntry, dataIndex }) => (
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
        )}
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
