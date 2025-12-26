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

import * as Styled from "./SkippableSection.styles";

export interface SkippableSectionProps {
  title: string;
  skipped: boolean;
  onSkipChange: (skipped: boolean) => void;
  children: React.ReactNode;
}

export function SkippableSection({
  title,
  skipped,
  onSkipChange,
  children,
}: SkippableSectionProps) {
  return (
    <Styled.Wrapper>
      <Styled.HeaderContainer>
        <Styled.Title>{title}</Styled.Title>
        <Styled.SkipContainer>
          <Styled.SkipLabel>Skip</Styled.SkipLabel>
          <Styled.SkipCheckbox
            type="checkbox"
            checked={skipped}
            onChange={(e) => onSkipChange(e.target.checked)}
          />
        </Styled.SkipContainer>
      </Styled.HeaderContainer>

      <Styled.ContentContainer skipped={skipped}>
        {children}
      </Styled.ContentContainer>
    </Styled.Wrapper>
  );
}
