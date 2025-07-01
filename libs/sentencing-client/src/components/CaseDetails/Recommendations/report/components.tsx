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

import _ from "lodash";
import moment from "moment";
import React from "react";

import { CaseInsight } from "../../../../api";
import {
  convertDecimalToPercentage,
  printFormattedRecordString,
} from "../../../../utils/utils";
import InfoIcon from "../../../assets/info-icon.svg?react";
import RecidivizLogo from "../../../assets/recidiviz-logo-bw.png";
import { INDIVIDUALS_STRING } from "../../components/charts/common/constants";
import {
  getSentenceLengthBucketLabel,
  getSubtitleGender,
  getSubtitleLsirScore,
} from "../../components/charts/common/utils";
import * as CommonStyled from "../../components/charts/components/Styles";
import { OffenseText } from "../../components/charts/RecidivismChart/RecidivismChartExplanation";
import { RecidivismChartFootnote } from "../../components/charts/RecidivismChart/SentenceLength/RecidivismChartFootnote";
import {
  getCompleteRollupRecidivismSeries,
  getRecidivismPlot,
} from "../../components/charts/RecidivismChart/SentenceLength/utils";
import { DispositionData, RecommendationOptionTemplateBase } from "../types";
import { getRecidivismPlotForSentenceType } from "./Plot";
import * as Styled from "./Report.styles";
import { getChartCaptions, getRecommendationOrderIndex } from "./utils";

interface RecidivismRatePlotsBySentenceTypeProps {
  insight: CaseInsight;
  recommendationOrder: RecommendationOptionTemplateBase[];
}

export function RecidivismRateSectionForSentenceType({
  insight,
  recommendationOrder,
}: RecidivismRatePlotsBySentenceTypeProps) {
  const cumulativeEndingEventRates = insight.rollupRecidivismSeries.map(
    (dp) => {
      const sortedDatapoints = [...dp.dataPoints].sort(
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
      getRecommendationOrderIndex(a, recommendationOrder) -
      getRecommendationOrderIndex(b, recommendationOrder),
  );

  const maxUpperCI =
    _.max(
      insight.rollupRecidivismSeries.flatMap((val) => {
        return val.dataPoints.map((dp) => dp.upperCI);
      }),
    ) ?? 0;

  const chartCaptions = getChartCaptions(insight);

  return (
    <>
      {sortedCumulativeEndingEventRates.map((dp) => {
        const recidivismSeries = _.find(
          insight.rollupRecidivismSeries,
          (series) => series.recommendationType === dp.recommendationType,
        )?.dataPoints;

        const plot = recidivismSeries
          ? getRecidivismPlotForSentenceType(recidivismSeries, maxUpperCI)
          : undefined;

        const chartCaption = dp.recommendationType
          ? chartCaptions[dp.recommendationType]
          : "";

        return (
          <Styled.SentencingRecidivismRateSection key={dp.recommendationType}>
            <Styled.RateDetailsTitlePercentage>
              <Styled.RateDetailsTitle>
                {dp.recommendationType}
              </Styled.RateDetailsTitle>
              <Styled.RateDetailsPercentage>
                {dp.endingEventRate !== undefined ? dp.endingEventRate : "--"}%
              </Styled.RateDetailsPercentage>
            </Styled.RateDetailsTitlePercentage>
            {/* Chart */}
            <div
              style={{ marginLeft: "-6px" }}
              ref={(ref) => {
                if (!ref || !plot) {
                  return undefined;
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
    </>
  );
}

interface RecidivismRateSectionForSentenceLengthProps {
  insight: CaseInsight;
  recommendationOrder: RecommendationOptionTemplateBase[];
}

export function RecidivismRateSectionForSentenceLength({
  insight,
  recommendationOrder,
}: RecidivismRateSectionForSentenceLengthProps) {
  const { missingSeriesLabels } = getCompleteRollupRecidivismSeries(
    recommendationOrder,
    insight.rollupRecidivismSeries,
  );

  const plot = getRecidivismPlot(
    insight,
    830,
    false,
    true,
    recommendationOrder,
  );
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{ marginLeft: "-6px" }}
        ref={(ref) => {
          if (!ref || !plot) {
            return undefined;
          }
          ref.replaceChildren();
          ref.appendChild(plot);
        }}
      />
      <RecidivismChartFootnote
        missingSeriesLabels={missingSeriesLabels}
        isReport
      />
    </div>
  );
}

interface DispositionElementProps {
  label: string;
  historicalSentencingPercentage: number | undefined;
}

function DispositionElement({
  label,
  historicalSentencingPercentage,
}: DispositionElementProps) {
  return (
    <Styled.SentencingRecidivismRateSection>
      <Styled.RateDetailsTitlePercentage>
        <Styled.RateDetailsTitle>{label}</Styled.RateDetailsTitle>
        <Styled.RateDetailsPercentage>
          {historicalSentencingPercentage}%
        </Styled.RateDetailsPercentage>
      </Styled.RateDetailsTitlePercentage>
      <Styled.ProgressBar percentage={historicalSentencingPercentage} />
    </Styled.SentencingRecidivismRateSection>
  );
}

interface DispositionSectionForSentenceTypeProps {
  datapoints: DispositionData[];
}

export function DispositionSectionForSentenceType({
  datapoints,
}: DispositionSectionForSentenceTypeProps) {
  return (
    <>
      {datapoints.map((dp) => {
        const historicalSentencingPercentage = convertDecimalToPercentage(
          dp.percentage,
        );

        return (
          <DispositionElement
            key={dp.recommendationType}
            label={dp.recommendationType ?? ""}
            historicalSentencingPercentage={historicalSentencingPercentage}
          />
        );
      })}
    </>
  );
}

interface DispositionSectionForSentenceLengthProps {
  datapoints: DispositionData[];
}

export function DispositionSectionForSentenceLength({
  datapoints,
}: DispositionSectionForSentenceLengthProps) {
  return (
    <>
      {datapoints.map((dp) => {
        const historicalSentencingPercentage = convertDecimalToPercentage(
          dp.percentage,
        );

        const label = getSentenceLengthBucketLabel(
          dp.recommendationType,
          dp.sentenceLengthBucketStart,
          dp.sentenceLengthBucketEnd,
        );

        return (
          <DispositionElement
            key={label}
            label={label}
            historicalSentencingPercentage={historicalSentencingPercentage}
          />
        );
      })}
    </>
  );
}

export function ReportHeader() {
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

export function ReportFooter({ infoPageLink }: { infoPageLink?: string }) {
  return (
    <>
      {infoPageLink && (
        <Styled.InfoPageLink>
          <InfoIcon />
          <span>
            Visit <strong> {infoPageLink} </strong> to learn more about the
            information presented in this report.
          </span>
        </Styled.InfoPageLink>
      )}

      <Styled.Disclaimer>
        <span>DISCLAIMER</span> This report is generated by Recidiviz and is for
        informational purposes only. Recidiviz does not guarantee the accuracy,
        completeness, validity, timeliness, or suitability of the information in
        this report and is not liable for any errors, omissions, or consequences
        of using the information. The information is not legal advice. Data on
        past conduct is not a guarantee of future outcomes. Users are solely
        responsible for their use of the information and agree that Recidiviz is
        not liable for any claim, loss, or damage arising from the use of this
        report.
      </Styled.Disclaimer>
      <Footer />
    </>
  );
}

interface AttributeChipsProps {
  insight?: CaseInsight;
  isV2?: boolean;
}

export function HistoricalSentencingAttributeChips({
  insight,
  isV2,
}: AttributeChipsProps) {
  if (!insight) return null;
  const numberOfRecords = insight?.dispositionNumRecords.toLocaleString();
  const genderString = getSubtitleGender(insight.gender);
  const lsirScore = getSubtitleLsirScore(
    insight.assessmentScoreBucketStart,
    insight.assessmentScoreBucketEnd,
  );

  return (
    <Styled.AttributesContainer isV2={isV2}>
      {numberOfRecords && (
        <Styled.NumberOfRecords isV2={isV2}>
          {numberOfRecords}{" "}
          {printFormattedRecordString(insight?.dispositionNumRecords)}
        </Styled.NumberOfRecords>
      )}
      <Styled.AttributeChipsWrapper isV2={isV2}>
        {genderString && genderString !== INDIVIDUALS_STRING && (
          <Styled.AttributeChip>{genderString}</Styled.AttributeChip>
        )}
        {lsirScore && <Styled.AttributeChip>{lsirScore}</Styled.AttributeChip>}
        <Styled.AttributeChip>{insight?.offense}</Styled.AttributeChip>
      </Styled.AttributeChipsWrapper>
    </Styled.AttributesContainer>
  );
}

export function CumulativeRecidivismRatesAttributeChips({
  insight,
}: AttributeChipsProps) {
  if (!insight) return null;

  const genderString = getSubtitleGender(insight.rollupGender);
  const lsirScore = getSubtitleLsirScore(
    insight.rollupAssessmentScoreBucketStart,
    insight.rollupAssessmentScoreBucketEnd,
  );
  const numberOfRecords = insight?.rollupRecidivismNumRecords.toLocaleString();

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
        {lsirScore && <Styled.AttributeChip>{lsirScore}</Styled.AttributeChip>}
        <Styled.AttributeChip>
          <OffenseText
            rollupOffenseDescription={insight.rollupOffenseDescription}
          />
        </Styled.AttributeChip>
      </Styled.AttributeChipsWrapper>
    </Styled.AttributesContainer>
  );
}

export function renderMultilineText(text?: string): React.ReactNode {
  if (!text) return null;
  const paragraphs = text.split("\n");

  return paragraphs.map((line, i) => {
    const isLastLine = i === paragraphs.length - 1;
    return (
      // eslint-disable-next-line react/no-array-index-key
      <React.Fragment key={line + i}>
        {line}
        {!isLastLine && <br />}
      </React.Fragment>
    );
  });
}

interface ExcludedDataPointsLegendProps {
  excludedDataPoints: DispositionData[];
}

export const ExcludedDataPointsLegend: React.FC<
  ExcludedDataPointsLegendProps
> = ({ excludedDataPoints }) => {
  const count = excludedDataPoints.length;
  if (count === 0) return null;

  const labels = excludedDataPoints
    .map((v) =>
      getSentenceLengthBucketLabel(
        v.recommendationType,
        v.sentenceLengthBucketStart,
        v.sentenceLengthBucketEnd,
      ),
    )
    .join(", ")
    .replace(/,(?=[^,]+$)/, " and");

  return (
    <CommonStyled.ChartFootnote>
      {`Note: ${labels} had zero values and ${
        count === 1 ? "is" : "are"
      } not represented in the chart.`}
    </CommonStyled.ChartFootnote>
  );
};
