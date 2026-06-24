// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { SAR } from "../../api";
import HomePlanIcon from "../assets/home-plan-icon.svg?react";
import { ReportBlock, SectionContinuationHeader } from "./ReportBlock";
import {
  BLOCK_GAP,
  DECLINED_TEXT,
} from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

const SECTION_TITLE = "Recommendation and Supervision Plan";
const CONTINUATION_TITLE = `${SECTION_TITLE} Continued...`;

function splitParagraphs(text: string): string[] {
  return text.split("\n").filter((l) => l.trim());
}

interface ReportRecommendationProps {
  sarData: SAR;
  isDeclined?: boolean;
}

export const ReportRecommendation: React.FC<ReportRecommendationProps> = ({
  sarData,
  isDeclined = false,
}) => {
  const {
    communityStrategyRecommendation,
    homePlan,
    institutionalStrategyRecommendation,
  } = sarData;

  const hasCommunity = !!(communityStrategyRecommendation || homePlan);
  const hasInstitutional = !!institutionalStrategyRecommendation;

  if (isDeclined) {
    return (
      <ReportBlock>
        <Styled.SectionTitleContainer>
          <Styled.SectionTitle>{SECTION_TITLE}</Styled.SectionTitle>
        </Styled.SectionTitleContainer>
        <Styled.FreeTextContent>{DECLINED_TEXT}</Styled.FreeTextContent>
      </ReportBlock>
    );
  }

  if (!hasCommunity && !hasInstitutional) return null;

  const communityParagraphs = communityStrategyRecommendation
    ? splitParagraphs(communityStrategyRecommendation)
    : [];

  const institutionalParagraphs = institutionalStrategyRecommendation
    ? splitParagraphs(institutionalStrategyRecommendation)
    : [];

  return (
    // All siblings flat so measureContinuationHeaders finds sar-no-split blocks via previousElementSibling.
    <Styled.ColumnFlexContainer gap={BLOCK_GAP / 2}>
      <ReportBlock>
        <Styled.SectionTitleContainer>
          <Styled.SectionTitle>{SECTION_TITLE}</Styled.SectionTitle>
        </Styled.SectionTitleContainer>
      </ReportBlock>

      {hasCommunity && (
        // StrategyBox is not a ReportBlock so cuts can fall between inner paragraph blocks.
        <Styled.StrategyBox>
          <Styled.StrategyTitle>Community Strategies</Styled.StrategyTitle>
          {communityParagraphs.map((paragraph) => (
            <ReportBlock key={paragraph}>
              <Styled.FreeTextContent>{paragraph}</Styled.FreeTextContent>
            </ReportBlock>
          ))}
          {homePlan && (
            <ReportBlock>
              <Styled.HomePlanBox>
                <Styled.HomePlanTitleRow>
                  <HomePlanIcon />
                  <Styled.HomePlanTitle>Home Plan</Styled.HomePlanTitle>
                </Styled.HomePlanTitleRow>
                <Styled.FreeTextContent>{homePlan}</Styled.FreeTextContent>
              </Styled.HomePlanBox>
            </ReportBlock>
          )}
        </Styled.StrategyBox>
      )}

      {hasInstitutional && (
        <>
          {/* Sentinel: gives measureContinuationHeaders a sar-no-split boundary after community. */}
          <ReportBlock>
            <div />
          </ReportBlock>
          <ReportBlock>
            <SectionContinuationHeader title={CONTINUATION_TITLE} />
            <Styled.StrategyBox>
              <Styled.StrategyTitle>
                Institutional Strategies
              </Styled.StrategyTitle>
              {institutionalParagraphs.map((paragraph) => (
                // Outer ReportBlock governs first-page snap only; inner blocks take over once past its top.
                <ReportBlock key={paragraph}>
                  <Styled.FreeTextContent>{paragraph}</Styled.FreeTextContent>
                </ReportBlock>
              ))}
            </Styled.StrategyBox>
          </ReportBlock>
        </>
      )}
    </Styled.ColumnFlexContainer>
  );
};
