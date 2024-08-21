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
