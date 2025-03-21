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
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import {
  getSentenceLengthBucketLabel,
  sortDataForSentenceLengthCharts,
} from "../../common/utils";
import NoDataMessage from "../../components/NoDataMessage";
import * as CommonStyled from "../../components/Styles";
import * as Styled from "../RecidivismChart.styles";
import { RecidivismChartExplanation } from "../RecidivismChartExplanation";
import { getRecidivismPlot, getRecidivismPlotSubtitle } from "./utils";

const DEFAULT_PLOT_WIDTH = 704;

interface RecidivismChartBySentenceLengthProps {
  insight?: CaseInsight;
  orgName: string;
  plotWidth?: number;
  hideInfoTooltip?: boolean;
}

export function RecidivismChartBySentenceLength({
  insight,
  orgName,
  plotWidth = DEFAULT_PLOT_WIDTH,
  hideInfoTooltip,
}: RecidivismChartBySentenceLengthProps) {
  const [isPlotFocused, setIsPlotFocused] = useState(false);
  const { rollupRecidivismNumRecords, rollupRecidivismSeries } = insight ?? {};

  const recidivismPlotSubtitle = insight && getRecidivismPlotSubtitle(insight);
  const plot = insight && getRecidivismPlot(insight, plotWidth, isPlotFocused);

  const recidivismChartLegend = useMemo(
    () =>
      sortDataForSentenceLengthCharts(rollupRecidivismSeries ?? []).map(
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
    [rollupRecidivismSeries],
  );

  return (
    <>
      <CommonStyled.ChartTitle>
        36 Month Cumulative Recidivism Rates with 95% Confidence
        {!hideInfoTooltip && insight && (
          <InfoIconWithTooltip
            headerText="36 Month Cumulative Recidivism Rates with 95% Confidence"
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
      {!insight ? (
        <NoDataMessage />
      ) : (
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
      )}
    </>
  );
}
