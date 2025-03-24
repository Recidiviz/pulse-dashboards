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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PieChart } from "react-minimal-pie-chart";
import { Tooltip, TooltipRefProps } from "react-tooltip";

import { Insight } from "../../../../../../api";
import { convertDecimalToPercentage } from "../../../../../../utils/utils";
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import {
  getSentenceLengthBucketLabel,
  sortDataForSentenceLengthCharts,
} from "../../common/utils";
import * as CommonStyled from "../../components/Styles";

const CHART_HEIGHT = 277;
const OPACITY = 0.3;
const DISPOSITION_VISIBILITY_THRESHOLD = 0.005;

function TooltipContent({
  title,
  percentage,
  numOffenses,
}: {
  title: string;
  percentage: number;
  numOffenses: number;
}) {
  const formattedPercentage = convertDecimalToPercentage(percentage);

  return (
    <div>
      <div style={{ color: "#FFFFFF", fontSize: 14, marginBottom: 8 }}>
        {`${title} (${formattedPercentage}%)`}
      </div>
      <div style={{ color: "#FFFFFFB2", fontSize: 12 }}>
        {`${numOffenses} offenses`}
      </div>
    </div>
  );
}

type DispositionChartBySentenceLengthProps = {
  dataPoints: NonNullable<Insight>["dispositionData"];
  totalNumOffenses: number;
};

export function DispositionChartBySentenceLength({
  dataPoints,
  totalNumOffenses,
}: DispositionChartBySentenceLengthProps) {
  const [focusedSegment, setFocusedSegment] = useState<number>();

  const [formattedDataPoints, excludedDataPoints] = useMemo(() => {
    const formattedDataPoints = sortDataForSentenceLengthCharts(dataPoints)
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

        const title = getSentenceLengthBucketLabel(
          recommendationType,
          sentenceLengthBucketStart,
          sentenceLengthBucketEnd,
        );

        return {
          title,
          value: percentage,
          color: SENTENCE_TYPE_TO_COLOR[title],
          numOffenses: Math.round(percentage * totalNumOffenses),
        };
      });

    const includedDataPoints = formattedDataPoints.filter(
      (dataPoint) => dataPoint.value >= DISPOSITION_VISIBILITY_THRESHOLD,
    );
    const excludedDataPoints = formattedDataPoints.filter(
      (dataPoint) => dataPoint.value < DISPOSITION_VISIBILITY_THRESHOLD,
    );

    return [includedDataPoints, excludedDataPoints];
  }, [dataPoints, totalNumOffenses]);

  const tooltipRef1 = useRef<TooltipRefProps>(null);
  useEffect(() => {
    if (focusedSegment !== undefined) {
      const focusedDataPoint = formattedDataPoints[focusedSegment];

      tooltipRef1.current?.open({
        anchorSelect: `#segment-${focusedSegment}`,
        content: (
          <TooltipContent
            title={focusedDataPoint.title}
            percentage={focusedDataPoint.value}
            numOffenses={focusedDataPoint.numOffenses}
          />
        ),
      });
    } else {
      tooltipRef1.current?.close();
    }
  }, [focusedSegment, formattedDataPoints]);

  const recidivismChartLegend = formattedDataPoints.map(({ title, color }) => (
    <CommonStyled.ChartLegendItem key={title}>
      <CommonStyled.ChartLegendDot $backgroundColor={color} />
      <div>{title}</div>
    </CommonStyled.ChartLegendItem>
  ));

  const numExcludedDataPoints = excludedDataPoints.length;

  const excludedDataPointsLegend = numExcludedDataPoints ? (
    <div style={{ marginTop: 16, color: "#2B5469CC" }}>
      {`Note: ${excludedDataPoints
        .map((v) => v.title)
        .join(", ")
        .replace(
          /,(?=[^,]+$)/,
          " and",
        )} had zero values and ${numExcludedDataPoints === 1 ? "is" : "are"} not represented in the chart.`}
    </div>
  ) : null;

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
      dataEntry: { value: number };
      dataIndex: number;
    }) => (
      <text
        id={`segment-${dataIndex}`}
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
        {`${convertDecimalToPercentage(dataEntry.value)}%`}
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
      <Tooltip
        ref={tooltipRef1}
        style={{ backgroundColor: "#001F1F", borderRadius: 8, padding: 16 }}
        imperativeModeOnly
        disableStyleInjection
      />

      <div style={{ marginTop: 35, width: 466 }}>
        <CommonStyled.ChartLegend>
          {recidivismChartLegend}
        </CommonStyled.ChartLegend>
        {excludedDataPointsLegend}
      </div>
    </div>
  );
}
