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
import DraggableScrollContainer from "../../DraggableScrollContainer/DraggableScrollContainer";
import * as Styled from "../CaseDetails.styles";
import { SelectedRecommendation } from "../types";
import { DispositionChart } from "./components/DispositionChart";
import { RECOMMENDATION_TYPE_TO_COLOR } from "./constants";
import { getRecidivismPlot, getRecidivismPlotSubtitle } from "./utils";

export interface InsightsProps {
  insight?: Insight;
  selectedRecommendation: SelectedRecommendation;
  fullName?: string;
}

export const Insights = ({
  insight,
  selectedRecommendation,
  fullName,
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
        <Styled.RecidivismChartLegendItem key={recommendationType}>
          <Styled.RecidivismChartLegendDot
            $backgroundColor={RECOMMENDATION_TYPE_TO_COLOR[recommendationType]}
          />
          <div>{recommendationType}</div>
        </Styled.RecidivismChartLegendItem>
      ),
  );

  return (
    <Styled.Insights>
      <Styled.InsightsHeaderWrapper>
        <Styled.Title>Insights</Styled.Title>
        <Styled.Description>
          This information represents outcomes for cases similar to that of the
          current client, {fullName}, based on gender, risk score, and type of
          conviction.
        </Styled.Description>
      </Styled.InsightsHeaderWrapper>

      {/* Charts */}
      <DraggableScrollContainer>
        <Styled.Charts>
          {/* Cumulative Recidivism Rates Chart */}
          <Styled.Chart $marginRight={16}>
            <Styled.ChartTitle>Cumulative Recidivism Rates</Styled.ChartTitle>
            <Styled.ChartSubTitle>
              {recidivismPlotSubtitle}{" "}
              <span>(Based on {rollupRecidivismNumRecords} records)</span>
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

          {/* Previous Sentence Rates Chart */}
          <Styled.Chart>
            <Styled.ChartTitle>Previous Sentences</Styled.ChartTitle>
            <Styled.ChartSubTitle>
              {recidivismPlotSubtitle}{" "}
              <span>(Based on {dispositionNumRecords} records)</span>
            </Styled.ChartSubTitle>
            <Styled.DispositionChartContainer>
              <DispositionChart
                dispositionData={dispositionData}
                selectedRecommendation={selectedRecommendation}
              />
            </Styled.DispositionChartContainer>
          </Styled.Chart>
        </Styled.Charts>
      </DraggableScrollContainer>
    </Styled.Insights>
  );
};
