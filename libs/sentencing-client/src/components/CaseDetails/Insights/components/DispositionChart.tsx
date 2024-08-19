import { Insight } from "../../../../api";
import { convertDecimalToPercentage } from "../../../../utils/utils";
import * as Styled from "../../CaseDetails.styles";
import { SelectedRecommendation } from "../../types";
import {
  RECOMMENDATION_TYPE_TO_BORDER_COLOR,
  RECOMMENDATION_TYPE_TO_COLOR,
} from "../constants";

const MIN_CIRCLE_HEIGHT = 60;
const MAX_CIRCLE_HEIGHT = 272;

const getChartCircleHeight = (percentage: number) => {
  return (
    MIN_CIRCLE_HEIGHT + percentage * (MAX_CIRCLE_HEIGHT - MIN_CIRCLE_HEIGHT)
  );
};

interface DispositionChartProps {
  dispositionData: Insight["dispositionData"];
  selectedRecommendation: SelectedRecommendation;
}

export function DispositionChart({
  dispositionData,
  selectedRecommendation,
}: DispositionChartProps) {
  const sortedDatapoints = dispositionData.sort(
    (a, b) => a.percentage - b.percentage,
  );
  const [smallestDatapoint, ...otherDatapoints] = sortedDatapoints;
  // Ordered by second largest percentage, largest percentage, and smallest percentage
  const orderedDatapoints = [...otherDatapoints, smallestDatapoint];

  return (
    <>
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
    </>
  );
}
