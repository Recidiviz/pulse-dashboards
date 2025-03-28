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

import { useMemo } from "react";

import { CaseInsight } from "../../../../../../api";
import { printFormattedRecordString } from "../../../../../../utils/utils";
import { InfoIconWithTooltip } from "../../../../../Tooltip/Tooltip";
import { NONE_OPTION } from "../../../../Form/constants";
import { RecommendationOptionType } from "../../../../Recommendations/constants";
import { SelectedRecommendation } from "../../../../types";
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import NoDataMessage from "../../components/NoDataMessage";
import * as CommonStyled from "../../components/Styles";
import { RECIDIVISM_RATES_CHART_TITLE } from "../../constants";
import * as Styled from "../RecidivismChart.styles";
import { RecidivismChartExplanation } from "../RecidivismChartExplanation";
import { getRecidivismPlot, getRecidivismPlotSubtitle } from "./utils";

const DEFAULT_PLOT_WIDTH = 704;

interface RecidivismChartBySentenceTypeProps {
  insight?: CaseInsight;
  orgName: string;
  selectedRecommendation: SelectedRecommendation;
  plotWidth?: number;
  hideInfoTooltip?: boolean;
}

export function RecidivismChartBySentenceType({
  insight,
  orgName,
  selectedRecommendation,
  plotWidth = DEFAULT_PLOT_WIDTH,
  hideInfoTooltip,
}: RecidivismChartBySentenceTypeProps) {
  const { rollupRecidivismNumRecords, rollupRecidivismSeries } = insight ?? {};

  const recidivismPlotSubtitle = insight && getRecidivismPlotSubtitle(insight);
  const plot =
    insight && getRecidivismPlot(insight, selectedRecommendation, plotWidth);

  const recidivismChartLegend = useMemo(
    () =>
      rollupRecidivismSeries?.map(
        ({ recommendationType }) =>
          recommendationType &&
          recommendationType !== NONE_OPTION && (
            <CommonStyled.ChartLegendItem key={recommendationType}>
              <CommonStyled.ChartLegendDot
                $backgroundColor={SENTENCE_TYPE_TO_COLOR[recommendationType]}
              />
              <div>{recommendationType}</div>
            </CommonStyled.ChartLegendItem>
          ),
      ),
    [rollupRecidivismSeries],
  );

  return (
    <>
      <CommonStyled.ChartTitle>
        {RECIDIVISM_RATES_CHART_TITLE}{" "}
        {!hideInfoTooltip && insight && (
          <InfoIconWithTooltip
            headerText={RECIDIVISM_RATES_CHART_TITLE}
            content={
              <CommonStyled.ChartTooltipContentSection>
                <RecidivismChartExplanation
                  insight={insight}
                  orgName={orgName}
                  isTooltip
                  recommendationOptionType={
                    RecommendationOptionType.SentenceType
                  }
                />
              </CommonStyled.ChartTooltipContentSection>
            }
          />
        )}
      </CommonStyled.ChartTitle>
      <CommonStyled.ChartSubTitle>
        {recidivismPlotSubtitle && (
          <>
            {recidivismPlotSubtitle}{" "}
            <span>
              (Based on {rollupRecidivismNumRecords?.toLocaleString()}{" "}
              {printFormattedRecordString(rollupRecidivismNumRecords ?? 0)})
            </span>
          </>
        )}
      </CommonStyled.ChartSubTitle>
      <CommonStyled.ChartLegend>
        {recidivismChartLegend}
      </CommonStyled.ChartLegend>
      {!rollupRecidivismNumRecords ? (
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
