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
import { RISK_LEVELS, RiskLevelKey } from "../OffenderAssessment/constants";
import {
  DomainConfig,
  ORASDomainRiskLevelField,
} from "../OffenderAssessment/utils";
import { ReportBlock, SectionContinuationHeader } from "./ReportBlock";
import { RISK_COLUMN_CONFIG } from "./ReportRiskProfileSummaryCard";
import * as Styled from "./SentencingAssessmentReport.styles";

const RISK_LEVEL_FILL_COUNT: Record<RiskLevelKey, number> = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
};

function extractRiskLevel(
  sarData: SAR,
  field: ORASDomainRiskLevelField | undefined,
): RiskLevelKey | null {
  if (!field) return null;
  const value = sarData[field];
  if (value === "LOW" || value === "MODERATE" || value === "HIGH") return value;
  return null;
}

interface ReportDomainSectionProps {
  domain: DomainConfig;
  sarData: SAR;
  hasOrasAssessment: boolean;
  extraContent?: React.ReactNode;
  tableContent?: React.ReactNode;
  /** When set, renders a "Continued..." section heading at the top of this
   *  block. The PDF generator hides it when no page break precedes this card —
   *  it only appears when a cut lands before this block's top. */
  continuationTitle?: string;
}

export const ReportDomainSection: React.FC<ReportDomainSectionProps> = ({
  domain,
  sarData,
  hasOrasAssessment,
  extraContent,
  tableContent,
  continuationTitle,
}) => {
  const riskLevel = extractRiskLevel(sarData, domain.riskLevelField);
  const riskChipConfig = RISK_COLUMN_CONFIG.find((c) => c.level === riskLevel);
  const summary = sarData[domain.summaryField];

  return (
    <ReportBlock>
      {continuationTitle && (
        <SectionContinuationHeader title={continuationTitle} />
      )}
      <Styled.ReportCardHeader>
        <span>{domain.title}</span>
        {riskLevel && riskChipConfig && hasOrasAssessment && (
          <Styled.RiskLevelIndicator>
            {[0, 1, 2].map((i) => (
              <Styled.RiskLevelBox
                key={i}
                $filled={i < RISK_LEVEL_FILL_COUNT[riskLevel]}
              />
            ))}
            <Styled.RiskLevelColumnHeader
              $bgColor={riskChipConfig.bgColor}
              $textColor={riskChipConfig.textColor}
            >
              {RISK_LEVELS[riskLevel]}
            </Styled.RiskLevelColumnHeader>
          </Styled.RiskLevelIndicator>
        )}
      </Styled.ReportCardHeader>
      <Styled.ReportDomainSectionBody>
        {summary && <Styled.FreeTextContent>{summary}</Styled.FreeTextContent>}
        {extraContent}
        {tableContent}
      </Styled.ReportDomainSectionBody>
    </ReportBlock>
  );
};
