// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Insight } from "../../../../api";
import { convertDecimalToPercentage } from "../../../../utils/utils";
import { InfoIconWithTooltip } from "../../../Tooltip/Tooltip";
import {
  TooltipContentSection,
  TooltipTextHighlight,
} from "../../../Tooltip/Tooltip.styles";
import { SelectedRecommendation } from "../../types";
import {
  RECOMMENDATION_TYPE_TO_BORDER_COLOR,
  RECOMMENDATION_TYPE_TO_COLOR,
} from "../common/constants";
import * as CommonStyled from "../common/Styles";
import * as Styled from "./DispositionChart.styles";
import { getDispositionChartSubtitle } from "./utils";

const MIN_CIRCLE_HEIGHT = 60;
const MAX_CIRCLE_HEIGHT = 272;

const getChartCircleHeight = (percentage: number) => {
  return (
    MIN_CIRCLE_HEIGHT + percentage * (MAX_CIRCLE_HEIGHT - MIN_CIRCLE_HEIGHT)
  );
};

interface DispositionChartProps {
  insight: Insight;
  selectedRecommendation: SelectedRecommendation;
  justifyContent?: "center" | "flex-start";
}

export function DispositionChart({
  insight,
  selectedRecommendation,
  justifyContent = "center",
}: DispositionChartProps) {
  const { dispositionData, dispositionNumRecords } = insight;

  const sortedDatapoints = dispositionData.sort(
    (a, b) => a.percentage - b.percentage,
  );
  const [smallestDatapoint, ...otherDatapoints] = sortedDatapoints;
  // Ordered by second largest percentage, largest percentage, and smallest percentage
  const orderedDatapoints = [...otherDatapoints, smallestDatapoint];

  const dispositionChartSubtitle = getDispositionChartSubtitle(insight);
  return (
    <>
      <CommonStyled.ChartTitle>
        Previous Sentences{" "}
        <InfoIconWithTooltip
          headerText="Previous Sentences"
          content={
            <TooltipContentSection>
              This information represents the percentage of cases sentenced to a
              particular dispositions over the past 3 years. The rates are based
              on <TooltipTextHighlight>{insight.gender}</TooltipTextHighlight>{" "}
              with{" "}
              <TooltipTextHighlight>
                LSI-R scores between {insight.assessmentScoreBucketStart} and{" "}
                {insight.assessmentScoreBucketEnd}
              </TooltipTextHighlight>{" "}
              with{" "}
              <TooltipTextHighlight>
                {insight.offense} convictions.
              </TooltipTextHighlight>
            </TooltipContentSection>
          }
        />
      </CommonStyled.ChartTitle>
      <CommonStyled.ChartSubTitle>
        {dispositionChartSubtitle} (Based on {dispositionNumRecords} records)
      </CommonStyled.ChartSubTitle>
      <Styled.DispositionChartContainer $justify={justifyContent}>
        {orderedDatapoints.map(
          ({ percentage, recommendationType }) =>
            recommendationType !== "None" && (
              <Styled.DispositionChartCircleContainer key={recommendationType}>
                <Styled.DispositionChartCircle
                  $height={getChartCircleHeight(percentage)}
                  $backgroundColor={
                    RECOMMENDATION_TYPE_TO_COLOR[recommendationType]
                  }
                  $borderColor={
                    recommendationType === selectedRecommendation
                      ? RECOMMENDATION_TYPE_TO_BORDER_COLOR[recommendationType]
                      : undefined
                  }
                >
                  {convertDecimalToPercentage(percentage)}%
                </Styled.DispositionChartCircle>
                <Styled.DispositionChartCircleLabel
                  $color={
                    recommendationType === selectedRecommendation
                      ? "#004D48"
                      : "#2B546999"
                  }
                >
                  {recommendationType}
                </Styled.DispositionChartCircleLabel>
              </Styled.DispositionChartCircleContainer>
            ),
        )}
      </Styled.DispositionChartContainer>
    </>
  );
}
