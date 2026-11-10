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

import * as ParentStyled from "../ProviderSelectionView.styles";
import { SuggestionCard } from "../SuggestionCard";

interface SuggestedProvidersProps {
  suggestions: HousingProvider[];
  onAdd: (id: string) => void;
  onSelect?: (id: string) => void;
}

export const SuggestedProviders: React.FC<SuggestedProvidersProps> = ({
  suggestions,
  onAdd,
  onSelect,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <ParentStyled.SuggestionListWrapper>
      <ParentStyled.SectionTitle>
        Suggestions ({suggestions.length})
      </ParentStyled.SectionTitle>
      {suggestions.map((provider) => (
        <SuggestionCard
          key={provider.id}
          provider={provider}
          onAdd={onAdd}
          onSelect={onSelect}
        />
      ))}
    </ParentStyled.SuggestionListWrapper>
  );
};
