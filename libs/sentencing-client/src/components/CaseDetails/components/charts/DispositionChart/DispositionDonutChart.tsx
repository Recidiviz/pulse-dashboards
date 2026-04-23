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
import { useState } from "react";

import { convertDecimalToPercentage } from "../../../../../utils/utils";
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
  inlineLayout?: boolean;
  selectedRecommendation?: string | null;
}

interface TooltipState {
  x: number;
  y: number;
  index: number;
  label: string;
  percentage: number;
  records: number;
}

export function DispositionDonutChart({
  datapoints,
  isReport,
  inlineLayout,
  selectedRecommendation,
  numberOfRecords,
}: DispositionDonutChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const includedDataPoints = datapoints.filter(
    (dp) => dp.percentage >= DISPOSITION_VISIBILITY_THRESHOLD,
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
    <Styled.DonutChartContainer>
      <Styled.DonutChartRow isReport={isReport} inlineLayout={inlineLayout}>
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
                tooltip?.index === i ||
                (tooltip === null &&
                  (!isSelectedRecommendationInData ||
                    isMatchingRecommendationSlice));

              return (
                <path
                  key={`arc-${label}`}
                  d={arcGenerator(dp) ?? undefined}
                  fill={
                    isReport
                      ? BW_COLOR_SCHEME[i]
                      : SENTENCE_TYPE_TO_COLOR[label]
                  }
                  stroke="#fff"
                  strokeWidth={1}
                  opacity={isActive ? 1 : 0.4}
                  onMouseMove={(e) => {
                    if (isReport) return;
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      index: i,
                      label,
                      percentage: convertDecimalToPercentage(
                        dp.data.percentage,
                      ),
                      records: Math.round(numberOfRecords * dp.data.percentage),
                    });
                  }}
                  onMouseLeave={() => {
                    if (!isReport) setTooltip(null);
                  }}
                />
              );
            })}
          </g>
        </svg>

        <CommonStyled.ChartLegendWrapper
          isReport={isReport}
          inlineLayout={inlineLayout}
        >
          <div>
            <CommonStyled.ChartLegend>
              <ChartLegend
                datapoints={datapoints}
                isReport={isReport}
                inlineLayout={inlineLayout}
              />
            </CommonStyled.ChartLegend>
          </div>
        </CommonStyled.ChartLegendWrapper>
      </Styled.DonutChartRow>

      {tooltip && (
        <Styled.DonutTooltipContainer
          style={{ left: tooltip.x + 12, top: tooltip.y - 50 }}
        >
          <Styled.DonutTooltipHeader>
            {tooltip.label} ({tooltip.percentage}%)
          </Styled.DonutTooltipHeader>
          <Styled.DonutTooltipBody>
            {tooltip.records} {tooltip.records === 1 ? "record" : "records"}
          </Styled.DonutTooltipBody>
        </Styled.DonutTooltipContainer>
      )}
    </Styled.DonutChartContainer>
  );
}
