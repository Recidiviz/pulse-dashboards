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

import React from "react";

import {
  RECIDIVISM_RATES_TEXT,
  SENTENCE_DISTRIBUTION_TEXT,
} from "../../components/charts/constants";
import { DispositionChartExplanation } from "../../components/charts/DispositionChart/DispositionChartExplanation";
import { RecidivismChartExplanation } from "../../components/charts/RecidivismChart/RecidivismChartExplanation";
import {
  CumulativeRecidivismRatesAttributeChips,
  HistoricalSentencingAttributeChips,
} from "./components";
import * as Styled from "./Report.styles";
import { CustomReportProps } from "./types";

const ReportTemplateV1: React.FC<CustomReportProps> = ({
  fullName,
  selectedRecommendation,
  age,
  gender,
  recommendationOptionType,
  insight,
  geoConfig,
  dispositionSection,
  recidivismRateSection,
}) => {
  return (
    <>
      <Styled.Title>Case Insights</Styled.Title>
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
                  <Styled.AttributeChip>Gender: {gender}</Styled.AttributeChip>
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

      {/* Sentence Distribution */}
      <Styled.HistoricalBreakdown>
        <Styled.TitleAttributesWrapper>
          <Styled.SectionTitle>
            {SENTENCE_DISTRIBUTION_TEXT}
          </Styled.SectionTitle>
          <HistoricalSentencingAttributeChips insight={insight} />
        </Styled.TitleAttributesWrapper>

        <Styled.SentencingRecidivismRateContainer>
          <Styled.DispositionCardWrapper>
            {dispositionSection}
          </Styled.DispositionCardWrapper>
          {insight && (
            <Styled.Explanation>
              <DispositionChartExplanation
                insight={insight}
                orgName={geoConfig.orgName}
              />
            </Styled.Explanation>
          )}
        </Styled.SentencingRecidivismRateContainer>
      </Styled.HistoricalBreakdown>

      {/* Cumulative Recidivism Rate */}
      <Styled.CumulativeBreakdown>
        <Styled.TitleAttributesWrapper>
          <Styled.SectionTitle>
            {RECIDIVISM_RATES_TEXT} <span>(36 months)</span>
          </Styled.SectionTitle>
          <CumulativeRecidivismRatesAttributeChips insight={insight} />
        </Styled.TitleAttributesWrapper>

        <Styled.SentencingRecidivismRateContainer>
          <Styled.SentencingRecidivismRateWrapper>
            {recidivismRateSection}
          </Styled.SentencingRecidivismRateWrapper>
          {insight && (
            <Styled.Explanation>
              <RecidivismChartExplanation
                insight={insight}
                recommendationOptionType={recommendationOptionType}
                orgName={geoConfig.orgName}
              />
            </Styled.Explanation>
          )}
        </Styled.SentencingRecidivismRateContainer>
      </Styled.CumulativeBreakdown>
    </>
  );
};

export default ReportTemplateV1;
