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

import { CaseInsight } from "../../../../api";
import { convertDecimalToPercentage } from "../../../../utils/utils";
import { getSentenceLengthBucketLabel } from "../../components/charts/common/utils";
import { RecidivismChartFootnote } from "../../components/charts/RecidivismChart/SentenceLength/RecidivismChartFootnote";
import {
  getCompleteRollupRecidivismSeries,
  getRecidivismPlot,
} from "../../components/charts/RecidivismChart/SentenceLength/utils";
import { RecommendationOptionTemplateBase } from "../types";
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
  recommendationOptionsTemplate: RecommendationOptionTemplateBase[];
}

export function RecidivismRateSectionForSentenceLength({
  insight,
  recommendationOptionsTemplate,
}: RecidivismRateSectionForSentenceLengthProps) {
  const { missingSeriesLabels } = getCompleteRollupRecidivismSeries(
    recommendationOptionsTemplate,
    insight.rollupRecidivismSeries,
  );

  const plot = getRecidivismPlot(
    insight,
    830,
    false,
    true,
    recommendationOptionsTemplate,
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
  insight: CaseInsight;
  recommendationOrder: RecommendationOptionTemplateBase[];
}

export function DispositionSectionForSentenceType({
  insight,
  recommendationOrder,
}: DispositionSectionForSentenceTypeProps) {
  const sortedDispositionData = [...insight.dispositionData].sort(
    (a, b) =>
      getRecommendationOrderIndex(a, recommendationOrder) -
      getRecommendationOrderIndex(b, recommendationOrder),
  );

  return (
    <>
      {sortedDispositionData.map((dp) => {
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
  insight: CaseInsight;
  recommendationOrder: RecommendationOptionTemplateBase[];
}

export function DispositionSectionForSentenceLength({
  insight,
  recommendationOrder,
}: DispositionSectionForSentenceLengthProps) {
  const sortedDispositionData = [...insight.dispositionData].sort(
    (a, b) =>
      getRecommendationOrderIndex(a, recommendationOrder) -
      getRecommendationOrderIndex(b, recommendationOrder),
  );

  return (
    <>
      {sortedDispositionData.map((dp) => {
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
