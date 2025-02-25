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
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import { getSentenceLengthBucketText } from "../../common/utils";
import NoDataMessage from "../../components/NoDataMessage";
import * as CommonStyled from "../../components/Styles";
import * as Styled from "../RecidivismChart.styles";
import { RecidivismChartExplanation } from "../RecidivismChartExplanation";
import { getRecidivismPlot, getRecidivismPlotSubtitle } from "./utils";

const DEFAULT_PLOT_WIDTH = 704;

interface RecidivismChartBySentenceLengthProps {
  insight?: CaseInsight;
  plotWidth?: number;
  hideInfoTooltip?: boolean;
}

export function RecidivismChartBySentenceLength({
  insight,
  plotWidth = DEFAULT_PLOT_WIDTH,
  hideInfoTooltip,
}: RecidivismChartBySentenceLengthProps) {
  const [isPlotFocused, setIsPlotFocused] = useState(false);
  const { rollupRecidivismNumRecords, rollupRecidivismSeries } = insight ?? {};

  const recidivismPlotSubtitle = insight && getRecidivismPlotSubtitle(insight);
  const plot = insight && getRecidivismPlot(insight, plotWidth, isPlotFocused);

  const recidivismChartLegend = useMemo(
    () =>
      rollupRecidivismSeries?.map(
        ({
          recommendationType,
          sentenceLengthBucketStart,
          sentenceLengthBucketEnd,
        }) => {
          const text = getSentenceLengthBucketText(
            recommendationType,
            sentenceLengthBucketStart,
            sentenceLengthBucketEnd,
          );
          const color = SENTENCE_TYPE_TO_COLOR[text];

          return (
            <CommonStyled.ChartLegendItem key={text}>
              <CommonStyled.ChartLegendDot $backgroundColor={color} />
              <div>{text}</div>
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
                <RecidivismChartExplanation insight={insight} isTooltip />
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
