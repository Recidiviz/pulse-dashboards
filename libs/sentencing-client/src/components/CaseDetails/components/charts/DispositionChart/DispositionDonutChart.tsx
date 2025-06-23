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

import { arc, pie, PieArcDatum } from "d3-shape";
import { useRef, useState } from "react";
import { Tooltip, TooltipRefProps } from "react-tooltip";

import { convertDecimalToPercentage } from "../../../../../utils/utils";
import { TooltipContent } from "../../../../Tooltip/Tooltip";
import { ExcludedDataPointsLegend } from "../../../Recommendations/report/components";
import { DispositionData } from "../../../Recommendations/types";
import { BW_COLOR_SCHEME, SENTENCE_TYPE_TO_COLOR } from "../common/constants";
import { getSentenceLengthBucketLabel } from "../common/utils";
import { ChartLegend } from "../components/ChartLegend";
import * as CommonStyled from "../components/Styles";
import * as Styled from "./DispositionChart.styles";

const DISPOSITION_VISIBILITY_THRESHOLD = 0.005;
const DONUT_SIZE = 260;
const DONUT_RADIUS = DONUT_SIZE / 2;
const DONUT_G_TRANSFORM = `translate(${DONUT_RADIUS}, ${DONUT_RADIUS})`;

interface DispositionDonutChartProps {
  datapoints: DispositionData[];
  numberOfRecords: number;
  isReport?: boolean;
  selectedRecommendation?: string | null;
}

export function DispositionDonutChart({
  datapoints,
  isReport,
  selectedRecommendation,
  numberOfRecords,
}: DispositionDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const tooltipRef = useRef<TooltipRefProps>(null);

  const [includedDataPoints, excludedDataPoints] = datapoints.reduce(
    (acc, dataPoint) => {
      acc[
        dataPoint.percentage >= DISPOSITION_VISIBILITY_THRESHOLD ? 0 : 1
      ].push(dataPoint);
      return acc;
    },
    [[], []] as [DispositionData[], DispositionData[]],
  );

  const pieGenerator = pie<DispositionData>().value((d) => d.percentage);
  const arcs = pieGenerator(includedDataPoints);
  const arcGenerator = arc<PieArcDatum<DispositionData>>()
    .innerRadius(DONUT_RADIUS * 0.4)
    .outerRadius(DONUT_RADIUS);

  const normalizedSelectedRecommendation =
    selectedRecommendation?.toLowerCase() ?? null;
  const isSelectedRecommendationInData =
    normalizedSelectedRecommendation !== null &&
    includedDataPoints.some((dp) => {
      const label = getSentenceLengthBucketLabel(
        dp.recommendationType,
        dp.sentenceLengthBucketStart,
        dp.sentenceLengthBucketEnd,
      ).toLowerCase();
      return label === normalizedSelectedRecommendation;
    });

  return (
    <Styled.DonutChartContainer isReport={isReport}>
      <svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <g transform={DONUT_G_TRANSFORM}>
          {arcs.map((dp, i) => {
            const label = getSentenceLengthBucketLabel(
              includedDataPoints[i].recommendationType,
              includedDataPoints[i].sentenceLengthBucketStart,
              includedDataPoints[i].sentenceLengthBucketEnd,
            );
            const isMatchingRecommendationSlice =
              label.toLowerCase() === normalizedSelectedRecommendation;
            const isActive =
              isReport ||
              hoveredIndex === i ||
              (hoveredIndex === null &&
                (!isSelectedRecommendationInData ||
                  isMatchingRecommendationSlice));

            return (
              <path
                id={`segment-${i}`}
                key={`arc-${label}`}
                d={arcGenerator(dp) ?? undefined}
                fill={
                  isReport ? BW_COLOR_SCHEME[i] : SENTENCE_TYPE_TO_COLOR[label]
                }
                stroke="#fff"
                strokeWidth={1}
                opacity={isActive ? 1 : 0.4}
                onMouseEnter={() => {
                  if (!isReport) {
                    setHoveredIndex(i);
                    tooltipRef.current?.open({
                      anchorSelect: `#segment-${i}`,
                      place: "left",
                      content: (
                        <TooltipContent
                          headerText={`${label} (${convertDecimalToPercentage(dp.data.percentage)}%)`}
                          content={<>{`${numberOfRecords} offenses`}</>}
                          styleOverrides={{
                            color: "#575656",
                            fontSize: 12,
                          }}
                        />
                      ),
                    });
                  }
                }}
                onMouseLeave={() => {
                  if (!isReport) {
                    setHoveredIndex(null);
                    tooltipRef.current?.close();
                  }
                }}
              />
            );
          })}
        </g>
      </svg>

      <CommonStyled.ChartLegendWrapper isReport={isReport}>
        <div>
          <CommonStyled.ChartLegend>
            <ChartLegend datapoints={includedDataPoints} isReport={isReport} />
          </CommonStyled.ChartLegend>
          {!isReport && (
            <ExcludedDataPointsLegend excludedDataPoints={excludedDataPoints} />
          )}
        </div>
      </CommonStyled.ChartLegendWrapper>

      <Tooltip
        id="donut-tooltip"
        ref={tooltipRef}
        style={{
          backgroundColor: "white",
          borderRadius: 0,
          padding: 0,
          color: "black",
          outline: "1px solid black",
        }}
        noArrow
      />
    </Styled.DonutChartContainer>
  );
}
