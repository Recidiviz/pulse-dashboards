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
import {
  ReportBlock,
  SentencingAssessmentReportSection,
  SplittableFreeText,
} from "./ReportBlock";
import { DECLINED_TEXT } from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

const SECTION_TITLE = "Recommendation and Supervision Plan";

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

  if (isDeclined) {
    return (
      <SentencingAssessmentReportSection title={SECTION_TITLE}>
        <Styled.FreeTextContent>{DECLINED_TEXT}</Styled.FreeTextContent>
      </SentencingAssessmentReportSection>
    );
  }

  const communityBox =
    communityStrategyRecommendation || homePlan ? (
      <Styled.StrategyBox>
        <Styled.StrategyTitle>Community Strategies</Styled.StrategyTitle>
        {communityStrategyRecommendation && (
          <SplittableFreeText text={communityStrategyRecommendation} />
        )}
        {homePlan && (
          <ReportBlock>
            <Styled.HomePlanBox>
              <Styled.HomePlanTitleRow>
                <HomePlanIcon />
                <Styled.HomePlanTitle>Home Plan</Styled.HomePlanTitle>
              </Styled.HomePlanTitleRow>
              <SplittableFreeText text={homePlan} />
            </Styled.HomePlanBox>
          </ReportBlock>
        )}
      </Styled.StrategyBox>
    ) : null;

  const institutionalBox = institutionalStrategyRecommendation ? (
    <Styled.StrategyBox>
      <Styled.StrategyTitle>Institutional Strategies</Styled.StrategyTitle>
      <SplittableFreeText text={institutionalStrategyRecommendation} />
    </Styled.StrategyBox>
  ) : null;

  const firstBox = communityBox ?? institutionalBox;
  if (!firstBox) return null;

  return (
    // The section title shares a block with the first strategy box, so it
    // stays on the same page as that box's first line. The second box goes in
    // the section's "Continued..." block.
    <SentencingAssessmentReportSection
      title={SECTION_TITLE}
      continuationContent={communityBox ? institutionalBox : null}
    >
      <Styled.FirstStrategyContainer>{firstBox}</Styled.FirstStrategyContainer>
    </SentencingAssessmentReportSection>
  );
};
