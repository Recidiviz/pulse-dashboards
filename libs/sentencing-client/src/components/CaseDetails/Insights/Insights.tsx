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

import { Insight } from "../../../api/APIClient";
import chevronIcon from "../../assets/chevron-down.svg";
import * as Styled from "../CaseDetails.styles";
import { SelectedRecommendation } from "../types";
import { DispositionChart } from "./components/DispositionChart";
import { RECOMMENDATION_TYPE_TO_COLOR } from "./constants";
import { getRecidivismPlot, getRecidivismPlotSubtitle } from "./utils";

export interface InsightsProps {
  insight?: Insight;
  selectedRecommendation: SelectedRecommendation;
}

export const Insights = ({
  insight,
  selectedRecommendation,
}: InsightsProps) => {
  if (!insight) {
    return null;
  }

  const { dispositionData, rollupRecidivismNumRecords, dispositionNumRecords } =
    insight;

  const recidivismPlotSubtitle = getRecidivismPlotSubtitle(insight);
  const plot = getRecidivismPlot(insight, selectedRecommendation);

  const recidivismChartLegend = dispositionData.map(
    ({ recommendationType }) =>
      recommendationType !== "None" && (
        <Styled.RecidivismChartLegendItem>
          <Styled.RecidivismChartLegendDot
            $backgroundColor={RECOMMENDATION_TYPE_TO_COLOR[recommendationType]}
          />
          <div>{recommendationType}</div>
        </Styled.RecidivismChartLegendItem>
      ),
  );

  return (
    <Styled.Insights>
      <Styled.Title>Insights</Styled.Title>
      <Styled.ChartControls>
        <Styled.CarouselButtons>
          <Styled.CarouselButton>
            <img src={chevronIcon} alt="" />
          </Styled.CarouselButton>
          <Styled.CarouselButton>
            <img src={chevronIcon} alt="" style={{ rotate: "180deg" }} />
          </Styled.CarouselButton>
        </Styled.CarouselButtons>
      </Styled.ChartControls>
      <Styled.Charts>
        <Styled.Chart $marginRight={16}>
          <Styled.ChartTitle>Cumulative Recidivism Rates</Styled.ChartTitle>
          <Styled.ChartSubTitle>
            {recidivismPlotSubtitle} (Based on {rollupRecidivismNumRecords}{" "}
            records)
          </Styled.ChartSubTitle>
          <Styled.RecidivismChartLegend>
            {recidivismChartLegend}
          </Styled.RecidivismChartLegend>
          <Styled.RecidivismChartPlotContainer
            ref={(ref) => {
              if (!ref) {
                return;
              }
              ref.replaceChildren();
              ref.appendChild(plot);
            }}
          />
        </Styled.Chart>
        <Styled.Chart>
          <Styled.ChartTitle>Previous Sentences</Styled.ChartTitle>
          <Styled.ChartSubTitle>
            {recidivismPlotSubtitle} (Based on {dispositionNumRecords} records)
          </Styled.ChartSubTitle>
          <Styled.DispositionChartContainer>
            <DispositionChart
              dispositionData={dispositionData}
              selectedRecommendation={selectedRecommendation}
            />
          </Styled.DispositionChartContainer>
        </Styled.Chart>
      </Styled.Charts>
    </Styled.Insights>
  );
};
