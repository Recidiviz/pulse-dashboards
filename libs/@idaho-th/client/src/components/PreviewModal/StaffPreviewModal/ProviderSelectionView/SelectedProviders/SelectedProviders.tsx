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

import type { HousingProvider } from "~@idaho-th/client/interfaces/common";

import BedIcon from "../../../../assets/tabler-icon-bed.svg?react";
import * as ParentStyled from "../ProviderSelectionView.styles";
import { SelectedProviderCard } from "../SelectedProviderCard";
import * as Styled from "./SelectedProviders.styles";

interface SelectedProvidersProps {
  selected: HousingProvider[];
  onRemove: (id: string) => void;
  onSelect?: (id: string) => void;
  hideEmptyState?: boolean;
}

export const SelectedProviders: React.FC<SelectedProvidersProps> = ({
  selected,
  onRemove,
  onSelect,
  hideEmptyState,
}) => {
  if (selected.length === 0 && hideEmptyState) return null;

  return (
    <Styled.SelectedProvidersRoot>
      <ParentStyled.SectionTitle>
        Selected Providers ({selected.length})
      </ParentStyled.SectionTitle>
      {selected.length === 0 ? (
        <EmptyState />
      ) : (
        <Styled.SelectedProvidersWrapper>
          {selected.map((provider) => (
            <SelectedProviderCard
              key={provider.id}
              provider={provider}
              onRemove={onRemove}
              onSelect={onSelect}
            />
          ))}
        </Styled.SelectedProvidersWrapper>
      )}
    </Styled.SelectedProvidersRoot>
  );
};

const EmptyState = () => {
  return (
    <ParentStyled.SelectedEmptyState>
      <ParentStyled.EmptyStateIcon>
        <BedIcon />
      </ParentStyled.EmptyStateIcon>
      <ParentStyled.EmptyTitle>
        No preferred providers found
      </ParentStyled.EmptyTitle>
      <ParentStyled.EmptyBody>
        The client didn&apos;t indicate any preferred providers, or we
        weren&apos;t able to match them. Add providers from the suggestions
        below.
      </ParentStyled.EmptyBody>
    </ParentStyled.SelectedEmptyState>
  );
};
