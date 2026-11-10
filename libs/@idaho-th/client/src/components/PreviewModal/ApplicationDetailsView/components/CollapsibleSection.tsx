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

import * as Styled from "../ApplicationDetailsView.styles";

interface CollapsibleSectionProps {
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  showDivider?: boolean;
  title: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  children,
  isOpen,
  onToggle,
  showDivider = true,
  title,
}) => (
  <Styled.Section>
    <Styled.SectionHeader
      type="button"
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <Styled.SectionHeaderRow>
        <Styled.SectionTitle>{title}</Styled.SectionTitle>
        <Styled.ChevronIcon $open={isOpen}>
          <Styled.ArrowDown />
        </Styled.ChevronIcon>
      </Styled.SectionHeaderRow>
    </Styled.SectionHeader>
    {isOpen && <Styled.SectionContent>{children}</Styled.SectionContent>}
    {showDivider ? <Styled.SectionDivider aria-hidden /> : null}
  </Styled.Section>
);
