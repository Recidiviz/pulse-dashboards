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

import { Insight } from "../../../../../api";
import { InfoIconWithTooltip } from "../../../../Tooltip/Tooltip";
import { SelectedRecommendation } from "../../../types";
import { RECOMMENDATION_TYPE_TO_COLOR } from "../common/constants";
import NoDataMessage from "../components/NoDataMessage";
import * as CommonStyled from "../components/Styles";
import * as Styled from "./RecidivismPlot.styles";
import { RecidivismPlotExplanation } from "./RecidivismPlotExplanation";
import { getRecidivismPlot, getRecidivismPlotSubtitle } from "./utils";

const DEFAULT_PLOT_WIDTH = 704;

interface RecidivismPlotProps {
  insight?: Insight;
  selectedRecommendation: SelectedRecommendation;
  plotWidth?: number;
  hideInfoTooltip?: boolean;
}

export function RecidivismPlot({
  insight,
  selectedRecommendation,
  plotWidth = DEFAULT_PLOT_WIDTH,
  hideInfoTooltip,
}: RecidivismPlotProps) {
  const { dispositionData, rollupRecidivismNumRecords } = insight ?? {};

  const recidivismPlotSubtitle = insight && getRecidivismPlotSubtitle(insight);
  const plot =
    insight && getRecidivismPlot(insight, selectedRecommendation, plotWidth);

  const recidivismChartLegend = dispositionData?.map(
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
        Cumulative Recidivism Rates{" "}
        {!hideInfoTooltip && insight && (
          <InfoIconWithTooltip
            headerText="Previous Sentences"
            content={
              <CommonStyled.ChartTooltipContentSection>
                <RecidivismPlotExplanation insight={insight} />
              </CommonStyled.ChartTooltipContentSection>
            }
          />
        )}
      </CommonStyled.ChartTitle>
      <CommonStyled.ChartSubTitle>
        {recidivismPlotSubtitle && (
          <>
            {recidivismPlotSubtitle} (Based on {rollupRecidivismNumRecords}{" "}
            records)
          </>
        )}
      </CommonStyled.ChartSubTitle>
      <Styled.RecidivismChartLegend>
        {recidivismChartLegend}
      </Styled.RecidivismChartLegend>
      {!insight ? (
        <NoDataMessage />
      ) : (
        <Styled.RecidivismChartPlotContainer
          $width={plotWidth}
          ref={(ref) => {
            if (!ref || !plot) {
              return;
            }
            ref.replaceChildren();
            ref.appendChild(plot);
          }}
        />
      )}
    </>
  );
}