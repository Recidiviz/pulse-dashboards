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

import BookmarkIcon from "../../assets/pin-icon.svg?react";
import * as Styled from "./ProviderCard.styles";

export interface ProviderCardProps {
  name: string;
  /** Sub-line description of provider requirements */
  description?: string;
  /** When true, renders an inline "Preferred" badge next to the provider name */
  isPreferred?: boolean;
  /**
   * Content rendered below the description in the leading (left) column.
   * Use this for eligibility label badges or inline action buttons.
   */
  belowDescription?: React.ReactNode;
  /**
   * Content rendered in the trailing (right) column.
   * Use this for status badges, icon-only buttons (remove, etc.).
   */
  trailing?: React.ReactNode;
}

/**
 * Presentational provider card used across Staff and Provider views.
 * Contains no business logic or store access.
 */
export const ProviderCard: React.FC<ProviderCardProps> = ({
  name,
  description,
  isPreferred = false,
  belowDescription,
  trailing,
}) => {
  return (
    <Styled.CardRoot>
      <Styled.CardLeading>
        <Styled.CardNameRow>
          <Styled.CardName>{name}</Styled.CardName>
          {isPreferred && (
            <Styled.CardPreferredBadge>
              <BookmarkIcon />
              <Styled.CardPreferredText>Preferred</Styled.CardPreferredText>
            </Styled.CardPreferredBadge>
          )}
        </Styled.CardNameRow>

        {description && (
          <Styled.CardDescription>{description}</Styled.CardDescription>
        )}

        {belowDescription}
      </Styled.CardLeading>

      {trailing && <Styled.CardTrailing>{trailing}</Styled.CardTrailing>}
    </Styled.CardRoot>
  );
};
