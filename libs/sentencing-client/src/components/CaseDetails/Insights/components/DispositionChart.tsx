import _ from "lodash";

import { Insight } from "../../../../api";
import * as Styled from "../../CaseDetails.styles";
import { SelectedRecommendation } from "../../types";
import {
  RECOMMENDATION_TYPE_TO_BORDER_COLOR,
  RECOMMENDATION_TYPE_TO_COLOR,
} from "../constants";

const DISPOSITION_HEIGHT = 287.39;

interface DispositionChartProps {
  dispositionData: Insight["dispositionData"];
  selectedRecommendation: SelectedRecommendation;
}

export function DispositionChart({
  dispositionData,
  selectedRecommendation,
}: DispositionChartProps) {
  const maxPercentage = _.maxBy(dispositionData, "percentage")?.percentage ?? 1;

  return (
    <>
      {dispositionData.map(
        ({ percentage, recommendationType }) =>
          recommendationType !== "None" && (
            <Styled.DispositionChartCircleContainer>
              <Styled.DispositionChartCircle
                $height={(DISPOSITION_HEIGHT * percentage) / maxPercentage}
                $backgroundColor={
                  RECOMMENDATION_TYPE_TO_COLOR[recommendationType]
                }
                $borderColor={
                  recommendationType === selectedRecommendation
                    ? RECOMMENDATION_TYPE_TO_BORDER_COLOR[recommendationType]
                    : undefined
                }
              >
                {percentage * 100}%
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
    </>
  );
}
