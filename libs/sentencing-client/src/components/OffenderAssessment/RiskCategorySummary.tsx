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

interface DomainScore {
  name: string;
  score: number | null;
}

interface RiskCategorySummaryProps {
  domainScores: DomainScore[];
}

type RiskLevelKey = keyof typeof RISK_LEVELS;

export const RiskCategorySummary: React.FC<RiskCategorySummaryProps> = ({
  domainScores,
}) => {
  // Group domains by risk level
  const groupedDomains: Record<RiskLevelKey, string[]> = {
    HIGH: [],
    MODERATE: [],
    LOW: [],
  };

  domainScores.forEach(({ name, score }) => {
    if (score !== null && score !== undefined) {
      const riskLevel = calculateRiskLevel(score);
      groupedDomains[riskLevel].push(name);
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
