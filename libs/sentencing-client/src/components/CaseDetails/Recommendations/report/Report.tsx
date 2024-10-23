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

import _ from "lodash";
import moment from "moment";

import { CaseInsight } from "../../../../api";
import { convertDecimalToPercentage } from "../../../../utils/utils";
import MultiRightArrows from "../../../assets/multi-right-arrow.svg?react";
import RecidivizLogo from "../../../assets/recidiviz-logo-bw.png";
import {
  RecommendationType,
  SelectedRecommendation,
} from "../../../CaseDetails/types";
import {
  getDescriptionGender,
  getSubtitleLsirScore,
} from "../../components/charts/common/utils";
import { DispositionChartExplanation } from "../../components/charts/DispositionChart/DispositionChartExplanation";
import {
  OffenseText,
  RecidivismPlotExplanation,
} from "../../components/charts/RecidivismPlot/RecidivismPlotExplanation";
import { recommendationTypeOrder } from "../../constants";
import { DispositionCard } from "./DispositionCard";
import * as Styled from "./Report.styles";

interface ReportProps {
  fullName?: string;
  externalId: string;
  age: number;
  selectedRecommendation: SelectedRecommendation;
  insight?: CaseInsight;
}

function Header() {
  return (
    <Styled.Header>
      <div>Case Insights</div>
      <div>{moment().format("MMMM DD, YYYY")}</div>
    </Styled.Header>
  );
}

function Footer() {
  return (
    <Styled.Footer>
      <div>
        Report provided by
        <img src={RecidivizLogo} width="38px" alt="Recidiviz logo" />
      </div>
    </Styled.Footer>
  );
}

export function Report({
  insight,
  fullName,
  age,
  externalId,
  selectedRecommendation,
}: ReportProps) {
  const cumulativeRatesByRecommendationType =
    insight?.rollupRecidivismSeries.reduce(
      (acc, val) => {
        const sortedDatapoints = val.dataPoints.sort(
          (a, b) => a.cohortMonths - b.cohortMonths,
        );
        acc[val.recommendationType] = convertDecimalToPercentage(
          sortedDatapoints[val.dataPoints.length - 1].eventRate,
        );
        return acc;
      },
      {} as { [key: string]: number },
    );

  // Get the maximum upper CI value across all recommendation types
  const maxUpperCI =
    _.max(
      insight?.rollupRecidivismSeries.flatMap((val) => {
        return val.dataPoints.map((dp) => dp.upperCI);
      }),
    ) ?? 0;

  const dispositionDataWithCumulativeRates = insight?.dispositionData.map(
    (disposition) => {
      return {
        ...disposition,
        cumulativeRate:
          cumulativeRatesByRecommendationType?.[disposition.recommendationType],
      };
    },
  );

  const sortedDispositionDataWithCumulativeRates =
    dispositionDataWithCumulativeRates?.sort(
      (a, b) =>
        recommendationTypeOrder.indexOf(a.recommendationType) -
        recommendationTypeOrder.indexOf(b.recommendationType),
    );

  const selectedRecommendationRecidivismRate =
    selectedRecommendation &&
    cumulativeRatesByRecommendationType?.[selectedRecommendation];

  const mostCommonHistoricalSentencing = insight?.dispositionData.reduce(
    (mostCommonDisposition, currentDisposition) => {
      return currentDisposition.percentage > mostCommonDisposition.percentage
        ? currentDisposition
        : mostCommonDisposition;
    },
    insight.dispositionData[0],
  );

  const isCumulativeProbationRateHigherThanCurrentRecommendationRate =
    cumulativeRatesByRecommendationType && selectedRecommendation
      ? cumulativeRatesByRecommendationType[RecommendationType.Probation] >
        cumulativeRatesByRecommendationType[selectedRecommendation]
      : null;

  const gender = (
    insight?.gender || insight?.rollupGender
  )?.toLocaleLowerCase();

  const AttributeChips = () =>
    insight && (
      <Styled.AttributeChipsWrapper>
        <Styled.AttributeChip>
          {getDescriptionGender(insight.gender)}
        </Styled.AttributeChip>
        <Styled.AttributeChip>
          {getSubtitleLsirScore(
            insight.assessmentScoreBucketStart,
            insight.assessmentScoreBucketEnd,
          )}
        </Styled.AttributeChip>
        <Styled.AttributeChip>
          <OffenseText
            rollupOffense={insight.rollupOffense}
            rollupNcicCategory={insight.rollupNcicCategory}
            rollupCombinedOffenseCategory={
              insight.rollupCombinedOffenseCategory
            }
            rollupViolentOffense={insight.rollupViolentOffense}
          />
        </Styled.AttributeChip>
      </Styled.AttributeChipsWrapper>
    );

  return (
    <Styled.ReportContainer>
      <Styled.Page>
        <Header />
        <Styled.Title>
          Historical data for cases similar to this one...
        </Styled.Title>

        {/* Case Snapshot */}
        <Styled.CaseSnapshot>
          <Styled.SnapshotContainer>
            <Styled.SectionTitle>Case Overview</Styled.SectionTitle>
            <Styled.CaseOverview>
              <Styled.Name>{fullName}</Styled.Name>
              <Styled.AttributesWrapper>
                <Styled.ID>
                  ID: <span>{externalId}</span>
                </Styled.ID>
                <Styled.Gender>
                  Gender: <span>{gender}</span>
                </Styled.Gender>
                <Styled.Age>
                  Age: <span>{age}</span>
                </Styled.Age>
              </Styled.AttributesWrapper>
              <Styled.Offense>
                Offense: <span>{insight?.offense}</span>
              </Styled.Offense>
            </Styled.CaseOverview>
          </Styled.SnapshotContainer>
          <MultiRightArrows />
          <Styled.SnapshotContainer>
            <Styled.SectionTitle>Common Sentences</Styled.SectionTitle>
            <Styled.HistoricalDetails>
              Historically, most cases like this one were sentenced to{" "}
              <span>
                {mostCommonHistoricalSentencing?.recommendationType.toLocaleLowerCase()}
              </span>
              .
            </Styled.HistoricalDetails>
          </Styled.SnapshotContainer>
          <Styled.SnapshotContainer>
            <Styled.SectionTitle>Recidivism</Styled.SectionTitle>
            <Styled.HistoricalDetails>
              Cumulatively, those sentenced to probation had{" "}
              <span>
                {isCumulativeProbationRateHigherThanCurrentRecommendationRate
                  ? "higher"
                  : "lower"}{" "}
                recidivism rates
              </span>
              .
            </Styled.HistoricalDetails>
          </Styled.SnapshotContainer>
        </Styled.CaseSnapshot>

        {/* Disposition Breakdown */}
        <Styled.BreakdownByDisposition>
          <Styled.SectionTitle>Breakdown by Sentence</Styled.SectionTitle>

          <Styled.DispositionCardWrapper>
            {sortedDispositionDataWithCumulativeRates?.map((dp) => {
              const isSelected =
                dp.recommendationType === selectedRecommendation;

              return (
                <DispositionCard
                  key={dp.recommendationType}
                  isSelected={isSelected}
                  recommendationType={dp.recommendationType}
                  // ** Entry point for the chart component **
                  recidivismSeries={
                    _.find(
                      insight?.rollupRecidivismSeries,
                      (series) =>
                        series.recommendationType === dp.recommendationType,
                    )?.dataPoints
                  }
                  historicalSentencingPercentage={convertDecimalToPercentage(
                    dp.percentage,
                  )}
                  cumulativeRecidivismRatePercentage={dp.cumulativeRate}
                  recidivismRateDelta={
                    !isSelected &&
                    selectedRecommendationRecidivismRate &&
                    dp.cumulativeRate
                      ? selectedRecommendationRecidivismRate - dp.cumulativeRate
                      : undefined
                  }
                  maxUpperCI={maxUpperCI}
                />
              );
            })}
          </Styled.DispositionCardWrapper>
        </Styled.BreakdownByDisposition>

        {/* Historical Sentencing Explanation */}
        <Styled.HistoricalSentencingExplanationContainer>
          <Styled.SectionTitle noMargin>
            Historical Sentencing
          </Styled.SectionTitle>
          <AttributeChips />

          {insight && (
            <Styled.Explanation>
              <DispositionChartExplanation insight={insight} />
            </Styled.Explanation>
          )}
        </Styled.HistoricalSentencingExplanationContainer>

        {/* Cumulative Recidivism Rate Explanation */}
        <Styled.CumulativeRecidivismRateExplanationContainer>
          <Styled.SectionTitle noMargin>
            Cumulative Recidivism Rate
          </Styled.SectionTitle>
          <AttributeChips />

          {insight && (
            <Styled.Explanation>
              <RecidivismPlotExplanation insight={insight} />
            </Styled.Explanation>
          )}
        </Styled.CumulativeRecidivismRateExplanationContainer>

        <Styled.Disclaimer>
          <span>DISCLAIMER</span> This report is generated by Recidiviz and is
          for informational purposes only. Recidiviz does not guarantee the
          accuracy, completeness, validity, timeliness, or suitability of the
          information in this report and is not liable for any errors,
          omissions, or consequences of using the information. The information
          is not legal advice. Data on past conduct is not a guarantee of future
          outcomes. Users are solely responsible for their use of the
          information and agree that Recidiviz is not liable for any claim,
          loss, or damage arising from the use of this report.
        </Styled.Disclaimer>
        <Footer />
      </Styled.Page>
    </Styled.ReportContainer>
  );
}
