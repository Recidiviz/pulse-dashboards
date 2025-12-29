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

import { SkippableTextArea } from "../shared/SkippableTextArea/SkippableTextArea";
import * as Styled from "./DomainCard.styles";
import { RiskScoreChip } from "./RiskScoreChip";

interface DomainCardProps {
  title: string;
  riskScore?: number;
  helperText?: string; // Optional helper text shown below title
  children?: React.ReactNode; // Domain-specific form fields
  summaryValue: string | null;
  onSummaryChange: (value: string) => Promise<void>;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  title,
  riskScore,
  helperText,
  children,
  summaryValue,
  onSummaryChange,
  cardRef,
}) => {
  return (
    <Styled.ScrollWrapper ref={cardRef}>
      <Styled.CardContainer>
        <Styled.HeaderSection>
          <Styled.HeaderRow>
            <Styled.Title>{title}</Styled.Title>
            {riskScore !== undefined && <RiskScoreChip score={riskScore} />}
          </Styled.HeaderRow>

          {helperText && <Styled.HelperText>{helperText}</Styled.HelperText>}
        </Styled.HeaderSection>

        {children && <Styled.ContentArea>{children}</Styled.ContentArea>}

        <Styled.SummarySection>
          <Styled.SummaryLabel>Summary</Styled.SummaryLabel>
          <SkippableTextArea
            value={summaryValue}
            onChange={onSummaryChange}
            placeholder={`Please enter a summary of ${title.toLowerCase()}`}
            height="6.8125rem"
          />
        </Styled.SummarySection>
      </Styled.CardContainer>
    </Styled.ScrollWrapper>
  );
};
