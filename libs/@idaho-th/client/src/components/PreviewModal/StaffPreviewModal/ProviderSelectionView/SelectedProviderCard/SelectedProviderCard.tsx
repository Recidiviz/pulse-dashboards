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

import React, { useState } from "react";

import { ConfirmationModal } from "~@idaho-th/client/components/ConfirmationModal";
import type { HousingProvider } from "~@idaho-th/client/interfaces/common";

import TrashIcon from "../../../../assets/trash-icon.svg?react";
import { PreferredBadge, ProviderLabels } from "../../common";
import {
  CardLeftSection,
  CardRightSection,
  ProviderName,
  TrashButton,
} from "../../common/styledComponents";
import * as Styled from "./SelectedProviderCard.styles";

interface SelectedProviderCardProps {
  provider: HousingProvider;
  onRemove: (id: string) => void;
  onSelect?: (id: string) => void;
}

export const SelectedProviderCard: React.FC<SelectedProviderCardProps> =
  React.memo(function SelectedProviderCard({ provider, onRemove, onSelect }) {
    const { isPreferred, labels, name } = provider;
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    const handleConfirmRemove = () => {
      onRemove(provider.id);
      setIsRemoveModalOpen(false);
    };

    const handleTrashClick = (event: React.MouseEvent) => {
      event.stopPropagation();
      setIsRemoveModalOpen(true);
    };

    return (
      <>
        <Styled.SelectedCardWrapper
          onClick={onSelect && (() => onSelect(provider.id))}
          style={{ cursor: onSelect ? "pointer" : undefined }}
        >
          <Styled.TealStrip />
          <Styled.CardContent>
            <CardLeftSection>
              <ProviderName>{name}</ProviderName>
              <ProviderLabels labels={labels ?? []} />
            </CardLeftSection>

            <CardRightSection>
              {isPreferred && <PreferredBadge />}
              <TrashButton
                type="button"
                aria-label={`Remove ${name}`}
                onClick={handleTrashClick}
              >
                <TrashIcon />
              </TrashButton>
            </CardRightSection>
          </Styled.CardContent>
        </Styled.SelectedCardWrapper>

        {/* Outside the card: portal clicks would otherwise bubble to its onClick */}
        <ConfirmationModal
          isOpen={isRemoveModalOpen}
          onClose={() => setIsRemoveModalOpen(false)}
          onConfirm={handleConfirmRemove}
          variant="destructive"
          heading="Remove provider?"
          subheading="This provider will be removed from your selected list and will reappear in suggestions."
          primaryBtnText="Remove provider"
          secondaryBtnText="Cancel"
        />
      </>
    );
  });
