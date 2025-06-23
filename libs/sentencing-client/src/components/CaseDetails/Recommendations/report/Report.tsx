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
import { GeoConfig } from "../../../../geoConfigs/types";
import { SelectedRecommendation } from "../../../CaseDetails/types";
import { DispositionDonutChart } from "../../components/charts/DispositionChart/DispositionDonutChart";
import { RecommendationOptionType } from "../constants";
import {
  DispositionSectionForSentenceType,
  RecidivismRateSectionForSentenceLength,
  RecidivismRateSectionForSentenceType,
  ReportFooter,
  ReportHeader,
} from "./components";
import * as Styled from "./Report.styles";
import { CustomReportProps } from "./types";
import { getRecommendationOrderIndex } from "./utils";

interface ReportProps {
  fullName?: string;
  externalId: string;
  age?: number;
  selectedRecommendation: SelectedRecommendation;
  insight?: CaseInsight;
  geoConfig: GeoConfig;
  protectiveFactors?: string[] | null;
  needs?: string[] | null;
  recommendationSummary?: string;
}

export function Report({
  insight,
  fullName,
  age,
  selectedRecommendation,
  geoConfig,
  protectiveFactors,
  needs,
  recommendationSummary,
}: ReportProps) {
  const recommendationOptionType = geoConfig.recommendation.type;
  const recommendationOrder = geoConfig.recommendation.baseOptionsTemplate;
  const gender = (
    insight?.gender || insight?.rollupGender
  )?.toLocaleLowerCase();
  const sortedDispositionData = [...(insight?.dispositionData ?? [])].sort(
    (a, b) =>
      getRecommendationOrderIndex(a, recommendationOrder) -
      getRecommendationOrderIndex(b, recommendationOrder),
  );

  let dispositionSection;
  if (insight?.dispositionNumRecords) {
    dispositionSection =
      recommendationOptionType === RecommendationOptionType.SentenceType ? (
        <DispositionSectionForSentenceType datapoints={sortedDispositionData} />
      ) : (
        <DispositionDonutChart
          datapoints={sortedDispositionData}
          numberOfRecords={insight.dispositionNumRecords}
          isReport
        />
      );
  } else {
    dispositionSection = (
      <Styled.RateDetailsTitle>No previous records</Styled.RateDetailsTitle>
    );
  }

  const recidivismRateSection =
    insight &&
    (recommendationOptionType === RecommendationOptionType.SentenceType ? (
      <RecidivismRateSectionForSentenceType
        insight={insight}
        recommendationOrder={recommendationOrder}
      />
    ) : (
      <RecidivismRateSectionForSentenceLength
        insight={insight}
        recommendationOrder={recommendationOrder}
      />
    ));

  const reportContentProps: CustomReportProps = {
    fullName,
    age,
    selectedRecommendation,
    recommendationOptionType,
    protectiveFactors,
    needs,
    recommendationSummary,
    insight,
    geoConfig,
    gender,
    dispositionSection,
    recidivismRateSection,
  };

  const ReportContent = geoConfig.reportTemplate;

  return (
    <Styled.ReportContainer>
      <Styled.Page>
        <ReportHeader />
        <ReportContent {...reportContentProps} />
        <ReportFooter infoPageLink={geoConfig.infoPageLink} />
      </Styled.Page>
    </Styled.ReportContainer>
  );
}
