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

import { rem } from "polished";
import styled from "styled-components";

import { Button, palette, typography } from "~design-system";

/**
 * Pieces of the US_MO "Recent Case Notes" card that no other state shares.
 * The note rows themselves live in core/CaseNotes, which US_ID reuses.
 */

/** "Go to ARB" button — Figma node 7427-2511.
 *
 * `kind="secondary" shape="block"` gives us the bordered white background with
 * 4px corner radius (NOT a pill). The remaining tokens (slate85 text + icon,
 * slate20 border, padding, gap) are pulled out of the Figma node and applied
 * here so we don't ride on the design-system's pine4 secondary default. */
export const GoToArbButton = styled(Button).attrs({
  kind: "secondary" as const,
  shape: "block" as const,
})`
  border-color: ${palette.slate20};
  color: ${palette.slate85};
  gap: ${rem(8)};
  min-height: 0;
  min-width: 0;
  padding: ${rem(8)} ${rem(16)};

  &:hover,
  &:focus-visible {
    background-color: transparent;
    color: ${palette.slate85};
  }
`;

/** Subtitle copy sitting at the top of the bordered card frame. */
export const CardSubtitle = styled.p`
  ${typography.Sans12}
  color: ${palette.slate60};
  margin: 0;
  padding: ${rem(16)} ${rem(20)} 0;
`;
