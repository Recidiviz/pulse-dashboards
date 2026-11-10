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

import BedIcon from "../../../../assets/tabler-icon-bed.svg?react";
import * as Styled from "../ProviderSelectionView.styles";

interface FullEmptyStateViewProps {
  header: React.ReactNode;
  searchBar: React.ReactNode;
  title: React.ReactNode;
  body: React.ReactNode;
  children?: React.ReactNode;
}

export const FullEmptyStateView: React.FC<FullEmptyStateViewProps> = ({
  header,
  searchBar,
  title,
  body,
  children,
}) => (
  <Styled.ProviderRoot>
    <Styled.HeaderWrapper>
      {header}
      <Styled.SearchBarWrapper>{searchBar}</Styled.SearchBarWrapper>
    </Styled.HeaderWrapper>
    <Styled.FullEmptyState>
      <Styled.EmptyStateIcon>
        <BedIcon />
      </Styled.EmptyStateIcon>
      <Styled.EmptyTitle>{title}</Styled.EmptyTitle>
      <Styled.EmptyBody>{body}</Styled.EmptyBody>
    </Styled.FullEmptyState>
    {children}
  </Styled.ProviderRoot>
);
