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

import { Button2 } from "../../styles";
import * as Styled from "./HousingApplications.styles";
import { SearchBar } from "./SearchBar";
import { ActionItem } from "./types";

interface ProviderHeadingProps {
  title?: string;
  onSearchChange?: (value: string) => void;
  actions?: ActionItem[];
}

export const ProviderHeading: React.FC<ProviderHeadingProps> = ({
  title,
  onSearchChange,
  actions,
}) => {
  return (
    <Styled.PageHeadingWrapper>
      <Styled.ProviderPageHeadingTitleGroup>
        <Styled.PageHeadingTitleRow>
          <Styled.ProviderPageHeadingTitle>
            {title}
          </Styled.ProviderPageHeadingTitle>
          <Styled.InformationBadge>
            <Styled.InformationBadgeText>
              Provider Portal
            </Styled.InformationBadgeText>
          </Styled.InformationBadge>
          <Styled.PageHeadingBetaChip>
            <Styled.PageHeadingBetaChipText>
              Beta
            </Styled.PageHeadingBetaChipText>
          </Styled.PageHeadingBetaChip>
        </Styled.PageHeadingTitleRow>
        <Styled.PageHeadingSubtitle>
          Review applications, manage reservations, and confirm placements
        </Styled.PageHeadingSubtitle>
      </Styled.ProviderPageHeadingTitleGroup>

      <Styled.PageHeadingActions>
        {onSearchChange && <SearchBar onSearchChange={onSearchChange} />}
        {actions?.map(({ key, label, onClick }) => (
          <Styled.ProviderActionButton
            key={key}
            type="button"
            onClick={onClick}
          >
            <Button2>{label}</Button2>
          </Styled.ProviderActionButton>
        ))}
      </Styled.PageHeadingActions>
    </Styled.PageHeadingWrapper>
  );
};
