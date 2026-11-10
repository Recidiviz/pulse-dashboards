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

import { ActionButton } from "~@idaho-th/client/components/common/buttons";
import { PlusIcon } from "~@idaho-th/client/components/common/icons";
import type { HousingProvider } from "~@idaho-th/client/interfaces/common";
import { Button2, spacing } from "~@idaho-th/client/styles";

import { PreferredBadge, ProviderLabels } from "../../common";
import {
  CardLeftSection,
  CardRightSection,
  NameRow,
  ProviderCardWrapper,
  ProviderName,
} from "../../common/styledComponents";
import * as S from "./SuggestionCard.styles";

interface SuggestionCardProps {
  provider: HousingProvider;
  onAdd: (id: string) => void;
  onSelect?: (id: string) => void;
}

const ADD_BUTTON_STYLE = { padding: `0 ${spacing[4]}` };

export const SuggestionCard: React.FC<SuggestionCardProps> = React.memo(
  function SuggestionCard({ provider, onAdd, onSelect }) {
    const { labels, name, isPreferred } = provider;

    const handleAdd = (event: React.MouseEvent) => {
      event.stopPropagation();
      onAdd(provider.id);
    };

    return (
      <ProviderCardWrapper
        onClick={onSelect && (() => onSelect(provider.id))}
        style={{ cursor: onSelect ? "pointer" : undefined }}
      >
        <CardLeftSection>
          <NameRow>
            <ProviderName>{name}</ProviderName>
            {isPreferred && <PreferredBadge />}
          </NameRow>
          <ProviderLabels labels={labels ?? []} />
        </CardLeftSection>

        <CardRightSection>
          <ActionButton
            variant="secondary"
            aria-label={`Add ${name} to selected providers`}
            onClick={handleAdd}
            height="32px"
            style={ADD_BUTTON_STYLE}
          >
            <S.AddButtonWrapper>
              <PlusIcon size={14} />
              <Button2>Add provider</Button2>
            </S.AddButtonWrapper>
          </ActionButton>
        </CardRightSection>
      </ProviderCardWrapper>
    );
  },
);
