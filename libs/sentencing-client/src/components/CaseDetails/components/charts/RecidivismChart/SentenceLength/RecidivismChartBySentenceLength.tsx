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

import { useMemo, useState } from "react";

import { printFormattedRecordString } from "../../../../../../../src/utils/utils";
import { CaseInsight } from "../../../../../../api";
import { InfoIconWithTooltip } from "../../../../../Tooltip/Tooltip";
import { RecommendationOptionType } from "../../../../Recommendations/constants";
import { RecommendationOptionTemplateBase } from "../../../../Recommendations/types";
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import {
  getSentenceLengthBucketLabel,
  sortDataForSentenceLengthCharts,
} from "../../common/utils";
import NoDataMessage from "../../components/NoDataMessage";
import * as CommonStyled from "../../components/Styles";
import { RECIDIVISM_RATES_CHART_TITLE } from "../../constants";
import * as Styled from "../RecidivismChart.styles";
import { RecidivismChartExplanation } from "../RecidivismChartExplanation";
import { RecidivismChartFootnote } from "./RecidivismChartFootnote";
import {
  getCompleteRollupRecidivismSeries,
  getRecidivismPlot,
  getRecidivismPlotSubtitle,
} from "./utils";

const DEFAULT_PLOT_WIDTH = 704;

interface RecidivismChartBySentenceLengthProps {
  insight?: CaseInsight;
  orgName: string;
  plotWidth?: number;
  hideInfoTooltip?: boolean;
  baseOptionsTemplate: RecommendationOptionTemplateBase[];
}

export function RecidivismChartBySentenceLength({
  insight,
  orgName,
  plotWidth = DEFAULT_PLOT_WIDTH,
  hideInfoTooltip,
  baseOptionsTemplate,
}: RecidivismChartBySentenceLengthProps) {
  const [isPlotFocused, setIsPlotFocused] = useState(false);
  const { rollupRecidivismNumRecords, rollupRecidivismSeries } = insight ?? {};

  const { completeRollupRecidivismSeries, missingSeriesLabels } =
    getCompleteRollupRecidivismSeries(
      baseOptionsTemplate,
      rollupRecidivismSeries,
    );

  const recidivismPlotSubtitle = insight && getRecidivismPlotSubtitle(insight);
  const plot =
    insight &&
    getRecidivismPlot(
      insight,
      plotWidth,
      isPlotFocused,
      undefined,
      baseOptionsTemplate,
    );

  const recidivismChartLegend = useMemo(
    () =>
      sortDataForSentenceLengthCharts(completeRollupRecidivismSeries ?? []).map(
        ({
          recommendationType,
          sentenceLengthBucketStart,
          sentenceLengthBucketEnd,
        }) => {
          const label = getSentenceLengthBucketLabel(
            recommendationType,
            sentenceLengthBucketStart,
            sentenceLengthBucketEnd,
          );
          const color = SENTENCE_TYPE_TO_COLOR[label];

          return (
            <CommonStyled.ChartLegendItem key={label}>
              <CommonStyled.ChartLegendDot $backgroundColor={color} />
              <div>{label}</div>
            </CommonStyled.ChartLegendItem>
          );
        },
      ),
    [completeRollupRecidivismSeries],
  );

  return (
    <>
      <CommonStyled.ChartTitle>
        {RECIDIVISM_RATES_CHART_TITLE}
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
                    RecommendationOptionType.SentenceLength
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
        <>
          <Styled.RecidivismChartPlotContainer
            onMouseOver={() => setIsPlotFocused(true)}
            onMouseOut={() => setIsPlotFocused(false)}
            $width={plotWidth}
            ref={(ref) => {
              if (!ref || !plot) {
                return;
              }
              ref.replaceChildren();
              ref.appendChild(plot);
            }}
          />
          <RecidivismChartFootnote missingSeriesLabels={missingSeriesLabels} />
        </>
      )}
    </>
  );
}
