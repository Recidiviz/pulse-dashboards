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

import { CaseInsight } from "../../../../api";
import { RecommendationType } from "../../types";
import { getRecidivismPlot } from "./Plot";
import * as Styled from "./Report.styles";

type DispositionCardProps = {
  recommendationType: keyof typeof RecommendationType;
  isSelected: boolean;
  recidivismSeries?: CaseInsight["rollupRecidivismSeries"][0]["dataPoints"];
  historicalSentencingPercentage?: number;
  cumulativeRecidivismRatePercentage?: number;
  recidivismRateDelta?: number;
  maxUpperCI: number;
};

export const DispositionCard = ({
  recommendationType,
  isSelected,
  recidivismSeries,
  historicalSentencingPercentage,
  cumulativeRecidivismRatePercentage,
  recidivismRateDelta,
  maxUpperCI,
}: DispositionCardProps) => {
  const recidivismRateComparisonText =
    recidivismRateDelta &&
    `${Math.abs(recidivismRateDelta)}% ${recidivismRateDelta && recidivismRateDelta < 0 ? "Higher" : "Lower"} Recidivism Rate`;

  const plot = recidivismSeries
    ? getRecidivismPlot(recidivismSeries, maxUpperCI)
    : undefined;

  return (
    <Styled.DispositionCard selected={isSelected}>
      <Styled.DispositionCardTitle>
        {recommendationType}
      </Styled.DispositionCardTitle>

      {/* Historical Sentencing */}
      <Styled.HistoricalSentencingWrapper>
        <Styled.HistoricalDetailsTitlePercentage>
          <Styled.HistoricalDetailsTitle>
            Historical Sentencing
          </Styled.HistoricalDetailsTitle>
          <Styled.HistoricalDetailsPercentage>
            {historicalSentencingPercentage !== undefined
              ? historicalSentencingPercentage
              : "--"}
            %
          </Styled.HistoricalDetailsPercentage>
        </Styled.HistoricalDetailsTitlePercentage>
        <Styled.ProgressBar percentage={historicalSentencingPercentage} />
      </Styled.HistoricalSentencingWrapper>

      <Styled.ChartContainer>
        {/* Cumulative Recidivism */}
        <Styled.HistoricalDetailsTitlePercentage>
          <Styled.HistoricalDetailsTitle>
            Cumulative Recidivism Rate (36 mo.)
          </Styled.HistoricalDetailsTitle>
          <Styled.HistoricalDetailsPercentage>
            {cumulativeRecidivismRatePercentage !== undefined
              ? cumulativeRecidivismRatePercentage
              : "--"}
            %
          </Styled.HistoricalDetailsPercentage>
        </Styled.HistoricalDetailsTitlePercentage>

        {/* Chart */}
        <div
          ref={(ref) => {
            if (!ref || !plot) {
              return;
            }
            ref.replaceChildren();
            ref.appendChild(plot);
          }}
        />
      </Styled.ChartContainer>

      {/* Caption */}
      <Styled.CardCaption>
        {isSelected ? `Recommendation by PSI` : recidivismRateComparisonText}
      </Styled.CardCaption>
    </Styled.DispositionCard>
  );
};
