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

import { calculateRiskLevel, RISK_COLORS, RISK_LEVELS } from "./constants";
import * as Styled from "./RiskCategorySummary.styles";
import { getDomainsForAssessmentType } from "./utils";

// Maps stored DomainRiskLevel (Prisma enum) to frontend RISK_LEVELS key
// DomainRiskLevel enum uses LOW/MODERATE/HIGH which matches RISK_LEVELS keys
function mapStoredRiskLevel(riskLevel: string): keyof typeof RISK_LEVELS {
  return riskLevel as keyof typeof RISK_LEVELS;
}

interface RiskCategorySummaryProps {
  assessmentType: string | null;
  domainScores: Record<string, number | null>; // scoreField -> score
  domainRiskLevels?: Record<string, string | null>; // scoreField -> stored DomainRiskLevel
}

type RiskLevelKey = keyof typeof RISK_LEVELS;

export const RiskCategorySummary: React.FC<RiskCategorySummaryProps> = ({
  assessmentType,
  domainScores,
  domainRiskLevels,
}) => {
  // Get domains for this assessment type
  const domains = getDomainsForAssessmentType(assessmentType);

  // Group domains by risk level
  const groupedDomains: Record<RiskLevelKey, string[]> = {
    HIGH: [],
    MODERATE: [],
    LOW: [],
  };

  domains.forEach((domain) => {
    // Skip domains with no score or risk level field (e.g. Responsivity - not numerically scored)
    if (!domain.scoreField || !domain.riskLevelField) return;

    const storedLevel = domainRiskLevels?.[domain.scoreField];
    if (storedLevel) {
      groupedDomains[mapStoredRiskLevel(storedLevel)].push(domain.title);
      return;
    }
    const score = domainScores[domain.scoreField];
    if (score !== null && score !== undefined) {
      const riskLevel = calculateRiskLevel(score);
      groupedDomains[riskLevel].push(domain.title);
    }
  });

  const columns: { level: RiskLevelKey; label: string }[] = [
    { level: "HIGH", label: RISK_LEVELS.HIGH },
    { level: "MODERATE", label: RISK_LEVELS.MODERATE },
    { level: "LOW", label: RISK_LEVELS.LOW },
  ];

  return (
    <Styled.Card>
      <Styled.CardTitle>Risk Category Summary</Styled.CardTitle>
      <Styled.ColumnsContainer>
        {columns.map(({ level, label }) => (
          <Styled.Column key={level}>
            <Styled.ColumnHeader>
              <Styled.ScoredLabel>Scored</Styled.ScoredLabel>
              <Styled.Chip $color={RISK_COLORS[level]}>{label}</Styled.Chip>
            </Styled.ColumnHeader>
            <Styled.DomainList>
              {groupedDomains[level].map((domain) => (
                <Styled.DomainItem key={domain}>{domain}</Styled.DomainItem>
              ))}
            </Styled.DomainList>
          </Styled.Column>
        ))}
      </Styled.ColumnsContainer>
    </Styled.Card>
  );
};
