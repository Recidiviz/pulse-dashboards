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

import { CaseInsight } from "../../../../../api";
import { printFormattedRecordString } from "../../../../../utils/utils";
import { InfoIconWithTooltip } from "../../../../Tooltip/Tooltip";
import { RecommendationOptionType } from "../../../Recommendations/constants";
import { SelectedRecommendation } from "../../../types";
import NoDataMessage from "../components/NoDataMessage";
import * as CommonStyled from "../components/Styles";
import { SENTENCE_DISTRIBUTION_TEXT } from "../constants";
import * as Styled from "./DispositionChart.styles";
import { DispositionChartExplanation } from "./DispositionChartExplanation";
import { DispositionDonutChart } from "./DispositionDonutChart";
import { DispositionChartBySentenceType } from "./SentenceType/DispositionChartBySentenceType";
import { getDispositionChartSubtitle } from "./utils";

interface DispositionChartProps {
  insight?: CaseInsight;
  selectedRecommendation: SelectedRecommendation;
  justifyContent?: "center" | "flex-start";
  scale?: number;
  hideInfoTooltip?: boolean;
  recommendationType: RecommendationOptionType;
  orgName: string;
}

export function DispositionChart({
  insight,
  selectedRecommendation,
  justifyContent = "center",
  scale,
  hideInfoTooltip,
  recommendationType,
  orgName,
}: DispositionChartProps) {
  const { dispositionData, dispositionNumRecords } = insight ?? {};

  const sortedDataPoints =
    (dispositionData &&
      [...dispositionData].sort((a, b) => a.percentage - b.percentage)) ??
    [];
  const [smallestDataPoint, ...otherDataPoints] = sortedDataPoints;
  // Ordered by second largest percentage, largest percentage, and smallest percentage
  const orderedDataPoints = [...otherDataPoints, smallestDataPoint].filter(
    (x) => x,
  );

  const dispositionChartSubtitle =
    insight && getDispositionChartSubtitle(insight);

  let chart;
  if (!dispositionNumRecords) {
    chart = <NoDataMessage />;
  } else if (recommendationType === RecommendationOptionType.SentenceType) {
    chart = (
      <Styled.DispositionChartBySentenceTypeContainer $justify={justifyContent}>
        <DispositionChartBySentenceType
          dataPoints={orderedDataPoints}
          selectedRecommendation={selectedRecommendation}
          scale={scale}
        />
      </Styled.DispositionChartBySentenceTypeContainer>
    );
  } else {
    chart = (
      <Styled.DispositionDonutChartContainer>
        <DispositionDonutChart
          datapoints={sortedDataPoints}
          selectedRecommendation={selectedRecommendation}
          numberOfRecords={dispositionNumRecords}
        />
      </Styled.DispositionDonutChartContainer>
    );
  }

  return (
    <>
      <CommonStyled.ChartTitle>
        {SENTENCE_DISTRIBUTION_TEXT}{" "}
        {!hideInfoTooltip && insight && (
          <InfoIconWithTooltip
            headerText={SENTENCE_DISTRIBUTION_TEXT}
            content={
              <CommonStyled.ChartTooltipContentSection>
                <DispositionChartExplanation
                  insight={insight}
                  orgName={orgName}
                />
              </CommonStyled.ChartTooltipContentSection>
            }
          />
        )}
      </CommonStyled.ChartTitle>
      <CommonStyled.ChartSubTitle>
        {dispositionChartSubtitle && (
          <>
            {dispositionChartSubtitle}{" "}
            <span>
              (Based on {dispositionNumRecords?.toLocaleString()}{" "}
              {printFormattedRecordString(dispositionNumRecords ?? 0)})
            </span>
          </>
        )}
      </CommonStyled.ChartSubTitle>
      {chart}
    </>
  );
}
