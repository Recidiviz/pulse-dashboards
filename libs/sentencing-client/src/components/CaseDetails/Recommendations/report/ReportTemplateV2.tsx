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

import MagnifyingGlassIcon from "../../../assets/magnifying-glass-black-icon.svg?react";
import ProtectiveFactorsIcon from "../../../assets/protective-factors-icon.svg?react";
import { SENTENCE_DISTRIBUTION_TEXT } from "../../components/charts/constants";
import { DispositionChartExplanation } from "../../components/charts/DispositionChart/DispositionChartExplanation";
import { OTHER_OPTION } from "../../Form/constants";
import {
  HistoricalSentencingAttributeChips,
  renderMultilineText,
} from "./components";
import * as Styled from "./Report.styles";
import { CustomReportProps } from "./types";
import { sliceAndFilterListItems } from "./utils";

const ReportTemplateV2: React.FC<CustomReportProps> = ({
  fullName,
  selectedRecommendation,
  age,
  gender,
  insight,
  geoConfig,
  dispositionSection,
  protectiveFactors,
  needs,
  recommendationSummary,
}) => {
  const hasProtectiveFactorsOrNeeds = Boolean(
    protectiveFactors?.length || needs?.length,
  );
  const recommendationOptionsTemplate =
    geoConfig.recommendation.baseOptionsTemplate;
  const selectedRecommendationType = recommendationOptionsTemplate.find(
    (option) => option.label === selectedRecommendation,
  )?.recommendationType;

  const incarcerationSuffix =
    selectedRecommendationType || selectedRecommendation === OTHER_OPTION
      ? ""
      : "Incarceration";

  return (
    <>
      <Styled.Title isV2>Case Insights</Styled.Title>
      <Styled.CaseOverviewContainer>
        <Styled.SectionTitleWrapper>
          <Styled.OverviewTitle>Name</Styled.OverviewTitle>
          <Styled.Name>{fullName}</Styled.Name>
        </Styled.SectionTitleWrapper>
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
      </Styled.CaseOverviewContainer>

      {/* Case Details (Mitigating Risk Factors & Areas of Need) */}
      {hasProtectiveFactorsOrNeeds && (
        <Styled.Section>
          <Styled.SectionTitle>Case Details</Styled.SectionTitle>
          <Styled.CaseDetailsContainer>
            {/* Protective Factors */}
            {protectiveFactors && protectiveFactors.length > 0 && (
              <Styled.ListContainer>
                <ProtectiveFactorsIcon />
                <Styled.ListWrapper>
                  Mitigating Risk Factors
                  <Styled.List>
                    {sliceAndFilterListItems(protectiveFactors, 8).map(
                      (factor) => (
                        <Styled.ListItem key={factor}>{factor}</Styled.ListItem>
                      ),
                    )}
                  </Styled.List>
                </Styled.ListWrapper>
              </Styled.ListContainer>
            )}
            {/* Areas of Need */}
            {needs && needs.length > 0 && (
              <Styled.ListContainer>
                <MagnifyingGlassIcon />
                <Styled.ListWrapper>
                  Areas of Need
                  <Styled.List>
                    {sliceAndFilterListItems(needs, 8).map((need) => (
                      <Styled.ListItem key={need}>{need}</Styled.ListItem>
                    ))}
                  </Styled.List>
                </Styled.ListWrapper>
              </Styled.ListContainer>
            )}
          </Styled.CaseDetailsContainer>
        </Styled.Section>
      )}

      {/* Recommendation + Summary */}
      <Styled.Section>
        <Styled.SectionTitleWrapper>
          <Styled.OverviewTitle>
            Recommendation by PSI Writer
          </Styled.OverviewTitle>
          <Styled.Name>
            {selectedRecommendation} {incarcerationSuffix}
          </Styled.Name>
        </Styled.SectionTitleWrapper>
        <Styled.RecommendationSummary>
          {renderMultilineText(recommendationSummary)}
        </Styled.RecommendationSummary>
      </Styled.Section>

      {/* Sentence Distribution */}
      <Styled.Section>
        <Styled.HistoricalOutcomeReference>
          Historical Outcome Reference
          <Styled.SubtitleText>
            <Styled.SubtitleIcon /> The following data represents historical
            trends, which do not predict or guarantee the outcome of any
            individual case.
          </Styled.SubtitleText>
        </Styled.HistoricalOutcomeReference>

        <Styled.HistoricalOutcomeRow>
          <Styled.HistoricalOutcomeSidebar>
            <Styled.SentenceDistributionTitle>
              {SENTENCE_DISTRIBUTION_TEXT}
            </Styled.SentenceDistributionTitle>
            {insight && (
              <Styled.Explanation>
                <DispositionChartExplanation
                  insight={insight}
                  orgName={geoConfig.orgName}
                />
              </Styled.Explanation>
            )}
          </Styled.HistoricalOutcomeSidebar>
          <Styled.HistoricalOutcomeContent>
            <HistoricalSentencingAttributeChips insight={insight} isV2 />
            {dispositionSection}
          </Styled.HistoricalOutcomeContent>
        </Styled.HistoricalOutcomeRow>
      </Styled.Section>
    </>
  );
};

export default ReportTemplateV2;
