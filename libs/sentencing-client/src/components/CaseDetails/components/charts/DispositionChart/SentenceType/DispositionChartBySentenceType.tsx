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

import { Insight } from "../../../../../../api";
import { convertDecimalToPercentage } from "../../../../../../utils/utils";
import { NONE_OPTION } from "../../../../Form/constants";
import { SelectedRecommendation } from "../../../../types";
import {
  RECOMMENDATION_TYPE_TO_BORDER_COLOR,
  SENTENCE_TYPE_TO_COLOR,
} from "../../common/constants";
import * as Styled from "../DispositionChart.styles";

const MIN_CIRCLE_HEIGHT = 60;
const MAX_CIRCLE_HEIGHT = 272;

const getChartCircleHeight = (percentage: number, scale = 1) => {
  const minHeight = MIN_CIRCLE_HEIGHT * scale;
  const maxHeight = MAX_CIRCLE_HEIGHT * scale;
  return minHeight + percentage * (maxHeight - minHeight);
};

type DispositionChartBySentenceTypeProps = {
  dataPoints: NonNullable<Insight>["dispositionData"];
  selectedRecommendation: SelectedRecommendation;
  scale?: number;
};

export function DispositionChartBySentenceType({
  dataPoints,
  selectedRecommendation,
  scale,
}: DispositionChartBySentenceTypeProps) {
  return (
    <>
      {dataPoints.map(
        ({ percentage, recommendationType }) =>
          recommendationType &&
          recommendationType !== NONE_OPTION && (
            <Styled.DispositionChartCircleContainer key={recommendationType}>
              <Styled.DispositionChartCircle
                $height={getChartCircleHeight(percentage, scale)}
                $backgroundColor={SENTENCE_TYPE_TO_COLOR[recommendationType]}
                $borderColor={
                  recommendationType === selectedRecommendation
                    ? RECOMMENDATION_TYPE_TO_BORDER_COLOR[recommendationType]
                    : undefined
                }
                $hideCircle={convertDecimalToPercentage(percentage) === 0}
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
                {convertDecimalToPercentage(percentage) > 0 &&
                  recommendationType}
              </Styled.DispositionChartCircleLabel>
            </Styled.DispositionChartCircleContainer>
          ),
      )}
    </>
  );
}
