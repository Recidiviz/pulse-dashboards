import { Insight } from "../../../../api";
import * as Styled from "../../CaseDetails.styles";
import { SelectedRecommendation } from "../../types";
import {
  RECOMMENDATION_TYPE_TO_BORDER_COLOR,
  RECOMMENDATION_TYPE_TO_COLOR,
} from "../constants";

const SENTENCES_WIDTH = 552;

interface DispositionChartProps {
  dispositionData: Insight["dispositionData"];
  selectedRecommendation: SelectedRecommendation;
}

export function DispositionChart({
  dispositionData,
  selectedRecommendation,
}: DispositionChartProps) {
  return (
    <>
      {dispositionData.map(
        ({ percentage, recommendationType }) =>
          recommendationType !== "None" && (
            <Styled.DispositionChartCircleContainer>
              <Styled.DispositionChartCircle
                $width={SENTENCES_WIDTH * percentage}
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
