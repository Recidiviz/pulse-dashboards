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
import {
  convertDecimalToPercentage,
  printFormattedRecordString,
} from "../../../../utils/utils";
import InfoIcon from "../../../assets/info-icon.svg?react";
import RecidivizLogo from "../../../assets/recidiviz-logo-bw.png";
import { SelectedRecommendation } from "../../../CaseDetails/types";
import { INDIVIDUALS_STRING } from "../../components/charts/common/constants";
import {
  getSubtitleGender,
  getSubtitleLsirScore,
} from "../../components/charts/common/utils";
import { DispositionChartExplanation } from "../../components/charts/DispositionChart/DispositionChartExplanation";
import {
  OffenseText,
  RecidivismPlotExplanation,
} from "../../components/charts/RecidivismPlot/RecidivismPlotExplanation";
import { recommendationTypeOrder } from "../../constants";
import { getRecidivismPlot } from "./Plot";
import * as Styled from "./Report.styles";
import { getChartCaptions } from "./utils";

interface ReportProps {
  fullName?: string;
  externalId: string;
  age?: number;
  selectedRecommendation: SelectedRecommendation;
  insight?: CaseInsight;
}

function Header() {
  return (
    <Styled.Header>
      <div>Report Attachment</div>
      <div>{moment().utc().format("MMMM DD, YYYY")}</div>
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
  selectedRecommendation,
}: ReportProps) {
  const cumulativeEndingEventRates = insight?.rollupRecidivismSeries.map(
    (dp) => {
      const sortedDatapoints = dp.dataPoints.sort(
        (a, b) => a.cohortMonths - b.cohortMonths,
      );
      return {
        ...dp,
        endingEventRate: convertDecimalToPercentage(
          sortedDatapoints[dp.dataPoints.length - 1].eventRate,
        ),
      };
    },
  );

  const sortedCumulativeEndingEventRates = cumulativeEndingEventRates?.sort(
    (a, b) =>
      recommendationTypeOrder.indexOf(a.recommendationType) -
      recommendationTypeOrder.indexOf(b.recommendationType),
  );

  const sortedDispositionData = insight?.dispositionData.sort(
    (a, b) =>
      recommendationTypeOrder.indexOf(a.recommendationType) -
      recommendationTypeOrder.indexOf(b.recommendationType),
  );

  const gender = (
    insight?.gender || insight?.rollupGender
  )?.toLocaleLowerCase();

  // Get the maximum upper CI value across all recommendation types
  const maxUpperCI =
    _.max(
      insight?.rollupRecidivismSeries.flatMap((val) => {
        return val.dataPoints.map((dp) => dp.upperCI);
      }),
    ) ?? 0;

  const chartCaptions = insight ? getChartCaptions(insight) : {};

  const HistoricalSentencingAttributeChips = () => {
    if (!insight) return null;
    const numberOfRecords = insight?.dispositionNumRecords.toLocaleString();
    const genderString = getSubtitleGender(insight.gender);
    const lsirScore = getSubtitleLsirScore(
      insight.assessmentScoreBucketStart,
      insight.assessmentScoreBucketEnd,
    );

    return (
      <Styled.AttributesContainer>
        {numberOfRecords && (
          <Styled.NumberOfRecords>
            {numberOfRecords}{" "}
            {printFormattedRecordString(insight?.dispositionNumRecords)}
          </Styled.NumberOfRecords>
        )}
        <Styled.AttributeChipsWrapper>
          {genderString && genderString !== INDIVIDUALS_STRING && (
            <Styled.AttributeChip>{genderString}</Styled.AttributeChip>
          )}
          {lsirScore && (
            <Styled.AttributeChip>{lsirScore}</Styled.AttributeChip>
          )}
          <Styled.AttributeChip>{insight?.offense}</Styled.AttributeChip>
        </Styled.AttributeChipsWrapper>
      </Styled.AttributesContainer>
    );
  };

  const CumulativeRecidivismRatesAttributeChips = () => {
    if (!insight) return null;

    const genderString = getSubtitleGender(insight.rollupGender);
    const lsirScore = getSubtitleLsirScore(
      insight.rollupAssessmentScoreBucketStart,
      insight.rollupAssessmentScoreBucketEnd,
    );
    const numberOfRecords =
      insight?.rollupRecidivismNumRecords.toLocaleString();

    return (
      <Styled.AttributesContainer>
        {numberOfRecords && (
          <Styled.NumberOfRecords>
            {numberOfRecords}{" "}
            {printFormattedRecordString(insight?.rollupRecidivismNumRecords)}
          </Styled.NumberOfRecords>
        )}
        <Styled.AttributeChipsWrapper>
          {genderString && genderString !== INDIVIDUALS_STRING && (
            <Styled.AttributeChip>{genderString}</Styled.AttributeChip>
          )}
          {lsirScore && (
            <Styled.AttributeChip>{lsirScore}</Styled.AttributeChip>
          )}
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
      </Styled.AttributesContainer>
    );
  };

  return (
    <Styled.ReportContainer>
      <Styled.Page>
        <Header />
        <Styled.Title>Case Insights</Styled.Title>

        {/* Case Overview */}
        <Styled.SnapshotContainer>
          <Styled.SectionTitle>Overview</Styled.SectionTitle>
          <Styled.CaseOverview>
            <Styled.OverviewWrapper>
              <Styled.OverviewTitle>Name</Styled.OverviewTitle>
              <Styled.Name>{fullName}</Styled.Name>
            </Styled.OverviewWrapper>

            <Styled.OverviewWrapper>
              <Styled.OverviewTitle>Recommendation by PSI</Styled.OverviewTitle>
              <Styled.Name>{selectedRecommendation}</Styled.Name>
            </Styled.OverviewWrapper>

            <Styled.OverviewWrapper>
              <Styled.OverviewTitle>Case Details</Styled.OverviewTitle>
              <Styled.AttributeChipsWrapper>
                {insight && (
                  <>
                    <Styled.AttributeChip>
                      Gender: {gender}
                    </Styled.AttributeChip>
                    <Styled.AttributeChip>Age: {age}</Styled.AttributeChip>
                    <Styled.AttributeChip>
                      Offense: {insight.offense}
                    </Styled.AttributeChip>
                  </>
                )}
              </Styled.AttributeChipsWrapper>
            </Styled.OverviewWrapper>
          </Styled.CaseOverview>
        </Styled.SnapshotContainer>

        {/* Historical Sentencing */}
        <Styled.HistoricalBreakdown>
          <Styled.TitleAttributesWrapper>
            <Styled.SectionTitle>Historical Sentencing</Styled.SectionTitle>
            <HistoricalSentencingAttributeChips />
          </Styled.TitleAttributesWrapper>

          <Styled.SentencingRecidivismRateContainer>
            <Styled.SentencingRecidivismRateWrapper>
              {(!sortedDispositionData ||
                sortedDispositionData.length === 0) && (
                <Styled.RateDetailsTitle>
                  No previous records
                </Styled.RateDetailsTitle>
              )}
              {sortedDispositionData?.map((dp) => {
                const historicalSentencingPercentage =
                  convertDecimalToPercentage(dp.percentage);
                return (
                  <Styled.SentencingRecidivismRateSection
                    key={dp.recommendationType}
                  >
                    <Styled.RateDetailsTitlePercentage>
                      <Styled.RateDetailsTitle>
                        {dp.recommendationType}
                      </Styled.RateDetailsTitle>
                      <Styled.RateDetailsPercentage>
                        {historicalSentencingPercentage !== undefined
                          ? historicalSentencingPercentage
                          : "--"}
                        %
                      </Styled.RateDetailsPercentage>
                    </Styled.RateDetailsTitlePercentage>
                    <Styled.ProgressBar
                      percentage={historicalSentencingPercentage}
                    />
                  </Styled.SentencingRecidivismRateSection>
                );
              })}
            </Styled.SentencingRecidivismRateWrapper>
            {insight && (
              <Styled.Explanation>
                <DispositionChartExplanation insight={insight} />
              </Styled.Explanation>
            )}
          </Styled.SentencingRecidivismRateContainer>
        </Styled.HistoricalBreakdown>

        {/* Cumulative Recidivism Rate */}
        <Styled.CumulativeBreakdown>
          <Styled.TitleAttributesWrapper>
            <Styled.SectionTitle>
              Cumulative Recidivism Rate <span>(36 months)</span>
            </Styled.SectionTitle>
            <CumulativeRecidivismRatesAttributeChips />
          </Styled.TitleAttributesWrapper>

          <Styled.SentencingRecidivismRateContainer>
            <Styled.SentencingRecidivismRateWrapper>
              {sortedCumulativeEndingEventRates?.map((dp) => {
                const recidivismSeries = _.find(
                  insight?.rollupRecidivismSeries,
                  (series) =>
                    series.recommendationType === dp.recommendationType,
                )?.dataPoints;

                const plot = recidivismSeries
                  ? getRecidivismPlot(recidivismSeries, maxUpperCI)
                  : undefined;

                // (https://github.com/Recidiviz/recidiviz-data/issues/35111): Handle cases were recommendationType is not set but sentence range is
                const chartCaption = dp.recommendationType
                  ? chartCaptions[dp.recommendationType]
                  : "";

                return (
                  <Styled.SentencingRecidivismRateSection
                    key={dp.recommendationType}
                  >
                    <Styled.RateDetailsTitlePercentage>
                      <Styled.RateDetailsTitle>
                        {dp.recommendationType}
                      </Styled.RateDetailsTitle>
                      <Styled.RateDetailsPercentage>
                        {dp.endingEventRate !== undefined
                          ? dp.endingEventRate
                          : "--"}
                        %
                      </Styled.RateDetailsPercentage>
                    </Styled.RateDetailsTitlePercentage>
                    {/* Chart */}
                    <div
                      style={{ marginLeft: "-6px" }}
                      ref={(ref) => {
                        if (!ref || !plot) {
                          return;
                        }
                        ref.replaceChildren();
                        ref.appendChild(plot);
                      }}
                    />
                    {/* Chart caption */}
                    <Styled.ChartCaption>{chartCaption}</Styled.ChartCaption>
                  </Styled.SentencingRecidivismRateSection>
                );
              })}
            </Styled.SentencingRecidivismRateWrapper>
            {insight && (
              <Styled.Explanation>
                <RecidivismPlotExplanation insight={insight} />
              </Styled.Explanation>
            )}
          </Styled.SentencingRecidivismRateContainer>
        </Styled.CumulativeBreakdown>

        {/* Recidiviz Info Page Link */}
        <Styled.InfoPageLink>
          <InfoIcon />
          <span>
            Visit <strong> recidiviz.org/sentencing/idaho </strong> to learn
            more about the information presented in this report.
          </span>
        </Styled.InfoPageLink>

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
