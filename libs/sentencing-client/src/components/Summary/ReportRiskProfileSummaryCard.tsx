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

import { palette } from "~design-system";

import { formatAssessmentNote } from "../../utils/utils";
import {
  AssessmentTypeKey,
  getAssessmentTypeShortName,
} from "../OffenderAssessment/assessmentTypeUtils";
import { RISK_LEVELS, RiskLevelKey } from "../OffenderAssessment/constants";
import { customPalette } from "../styles/palette";
import { ReportBlock } from "./ReportBlock";
import * as Styled from "./SentencingAssessmentReport.styles";

export const RISK_COLUMN_CONFIG: Array<{
  level: RiskLevelKey;
  bgColor: string;
  textColor: string;
}> = [
  { level: "HIGH", bgColor: customPalette.black, textColor: palette.white },
  {
    level: "MODERATE",
    bgColor: customPalette.grey.grey4,
    textColor: customPalette.black,
  },
  {
    level: "LOW",
    bgColor: customPalette.grey.grey5,
    textColor: customPalette.black,
  },
];

export interface RiskProfileCardData {
  assessmentType: AssessmentTypeKey | null;
  administeredBy: string | null;
  assessmentDate: string | null;
  ageAtAssessment: number | null;
  groupedDomains: Record<RiskLevelKey, string[]>;
}

export const ReportRiskProfileSummaryCard: React.FC<RiskProfileCardData> = ({
  assessmentType,
  administeredBy,
  assessmentDate,
  ageAtAssessment,
  groupedDomains,
}) => {
  const note = formatAssessmentNote(
    administeredBy,
    assessmentDate,
    ageAtAssessment,
  );
  return (
    <ReportBlock>
      <Styled.ReportCardHeader>
        <span>
          RISK PROFILE SUMMARY ({getAssessmentTypeShortName(assessmentType)})
        </span>
        {note && <span>{note}</span>}
      </Styled.ReportCardHeader>
      <Styled.RiskLevelColumnsContainer>
        {RISK_COLUMN_CONFIG.map(({ level, bgColor, textColor }) => (
          <Styled.RiskLevelColumn key={level}>
            <Styled.RiskLevelColumnHeader
              $bgColor={bgColor}
              $textColor={textColor}
            >
              {RISK_LEVELS[level]}
            </Styled.RiskLevelColumnHeader>
            {groupedDomains[level].map((domain) => (
              <Styled.RiskLevelDomainItem key={domain}>
                {domain}
              </Styled.RiskLevelDomainItem>
            ))}
          </Styled.RiskLevelColumn>
        ))}
      </Styled.RiskLevelColumnsContainer>
    </ReportBlock>
  );
};
