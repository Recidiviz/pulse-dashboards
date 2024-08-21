import { Insight } from "../../../../api";
import { SelectedRecommendation } from "../../types";
import { RECOMMENDATION_TYPE_TO_COLOR } from "../common/constants";
import * as CommonStyled from "../common/Styles";
import * as Styled from "./RecidivismPlot.styles";
import { getRecidivismPlot, getRecidivismPlotSubtitle } from "./utils";

const DEFAULT_PLOT_WIDTH = 704;

interface RecidivismPlotProps {
  insight: Insight;
  selectedRecommendation: SelectedRecommendation;
  plotWidth?: number;
}

export function RecidivismPlot({
  insight,
  selectedRecommendation,
  plotWidth = DEFAULT_PLOT_WIDTH,
}: RecidivismPlotProps) {
  const { dispositionData, rollupRecidivismNumRecords } = insight;

  const recidivismPlotSubtitle = getRecidivismPlotSubtitle(insight);
  const plot = getRecidivismPlot(insight, selectedRecommendation, plotWidth);

  const recidivismChartLegend = dispositionData.map(
    ({ recommendationType }) =>
      recommendationType !== "None" && (
        <Styled.RecidivismChartLegendItem key={recommendationType}>
          <Styled.RecidivismChartLegendDot
            $backgroundColor={RECOMMENDATION_TYPE_TO_COLOR[recommendationType]}
          />
          <div>{recommendationType}</div>
        </Styled.RecidivismChartLegendItem>
      ),
  );

  return (
    <>
      <CommonStyled.ChartTitle>
        Cumulative Recidivism Rates
      </CommonStyled.ChartTitle>
      <CommonStyled.ChartSubTitle>
        {recidivismPlotSubtitle} (Based on {rollupRecidivismNumRecords} records)
      </CommonStyled.ChartSubTitle>
      <Styled.RecidivismChartLegend>
        {recidivismChartLegend}
      </Styled.RecidivismChartLegend>
      <Styled.RecidivismChartPlotContainer
        $width={plotWidth}
        ref={(ref) => {
          if (!ref) {
            return;
          }
          ref.replaceChildren();
          ref.appendChild(plot);
        }}
      />
    </>
  );
}
