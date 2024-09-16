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

import { CaseInsight } from "../../../../../api";
import { convertDecimalToPercentage } from "../../../../../utils/utils";
import { InfoIconWithTooltip } from "../../../../Tooltip/Tooltip";
import { SelectedRecommendation } from "../../../types";
import {
  RECOMMENDATION_TYPE_TO_BORDER_COLOR,
  RECOMMENDATION_TYPE_TO_COLOR,
} from "../common/constants";
import NoDataMessage from "../components/NoDataMessage";
import * as CommonStyled from "../components/Styles";
import * as Styled from "./DispositionChart.styles";
import { DispositionChartExplanation } from "./DispositionChartExplanation";
import { getDispositionChartSubtitle } from "./utils";

const MIN_CIRCLE_HEIGHT = 60;
const MAX_CIRCLE_HEIGHT = 272;

const getChartCircleHeight = (percentage: number, scale = 1) => {
  const minHeight = MIN_CIRCLE_HEIGHT * scale;
  const maxHeight = MAX_CIRCLE_HEIGHT * scale;
  return minHeight + percentage * (maxHeight - minHeight);
};

interface DispositionChartProps {
  insight?: CaseInsight;
  selectedRecommendation: SelectedRecommendation;
  justifyContent?: "center" | "flex-start";
  scale?: number;
  hideInfoTooltip?: boolean;
}

export function DispositionChart({
  insight,
  selectedRecommendation,
  justifyContent = "center",
  scale,
  hideInfoTooltip,
}: DispositionChartProps) {
  const { dispositionData, dispositionNumRecords } = insight ?? {};

  const sortedDatapoints =
    dispositionData?.sort((a, b) => a.percentage - b.percentage) ?? [];
  const [smallestDatapoint, ...otherDatapoints] = sortedDatapoints;
  // Ordered by second largest percentage, largest percentage, and smallest percentage
  const orderedDatapoints = [...otherDatapoints, smallestDatapoint].filter(
    (x) => x,
  );

  const dispositionChartSubtitle =
    insight && getDispositionChartSubtitle(insight);
  return (
    <>
      <CommonStyled.ChartTitle>
        Previous Sentences{" "}
        {!hideInfoTooltip && insight && (
          <InfoIconWithTooltip
            headerText="Previous Sentences"
            content={
              <CommonStyled.ChartTooltipContentSection>
                <DispositionChartExplanation insight={insight} />
              </CommonStyled.ChartTooltipContentSection>
            }
          />
        )}
      </CommonStyled.ChartTitle>
      <CommonStyled.ChartSubTitle>
        {dispositionChartSubtitle && (
          <>
            {dispositionChartSubtitle} (Based on {dispositionNumRecords}{" "}
            records)
          </>
        )}
      </CommonStyled.ChartSubTitle>
      {!insight ? (
        <NoDataMessage />
      ) : (
        <Styled.DispositionChartContainer $justify={justifyContent}>
          {orderedDatapoints.map(
            ({ percentage, recommendationType }) =>
              recommendationType !== "None" && (
                <Styled.DispositionChartCircleContainer
                  key={recommendationType}
                >
                  <Styled.DispositionChartCircle
                    $height={getChartCircleHeight(percentage, scale)}
                    $backgroundColor={
                      RECOMMENDATION_TYPE_TO_COLOR[recommendationType]
                    }
                    $borderColor={
                      recommendationType === selectedRecommendation
                        ? RECOMMENDATION_TYPE_TO_BORDER_COLOR[
                            recommendationType
                          ]
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
      )}
    </>
  );
}
