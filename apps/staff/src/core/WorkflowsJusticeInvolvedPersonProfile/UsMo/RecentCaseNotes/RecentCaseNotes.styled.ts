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

/**
 * Styled primitives for the US_MO "Recent Case Notes" card. Tokens come from
 * Figma node 7364-3879. The card itself reuses `CardFrame` from the sibling
 * Case Overview module; this file adds the card-internal pieces (Header,
 * NoteRow, etc.) that are specific to Recent Case Notes.
 */

/** Row that lives ABOVE the bordered card frame: title left, "Go to ARB" right.
 * Matches the sibling Case Overview's external-heading pattern. */
export const ExternalHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: ${rem(8)};
`;

export const ExternalTitle = styled.h3`
  ${typography.Sans16}
  color: ${palette.slate80};
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0;
`;

/** Subtitle copy sitting at the top of the bordered card frame. */
export const CardSubtitle = styled.p`
  ${typography.Sans12}
  color: ${palette.slate60};
  margin: 0;
  padding: ${rem(16)} ${rem(20)} 0;
`;

export const NotesList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const NoteRow = styled.button.attrs({ type: "button" })`
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${palette.slate20};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${rem(8)};
  padding: ${rem(16)} ${rem(20)};
  text-align: left;
  width: 100%;

  &:last-child {
    border-bottom: 0;
  }

  &:hover,
  &:focus-visible {
    background: ${palette.slate10};
  }
`;

export const NoteMeta = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${rem(8)};
  justify-content: space-between;
`;

export const Source = styled.span`
  ${typography.Sans14}
  color: ${palette.slate60};
  font-weight: 500;
  letter-spacing: 0.5px;
`;

export const NoteDate = styled.span`
  ${typography.Sans12}
  color: ${palette.slate60};
  white-space: nowrap;
`;

export const NoteBody = styled.p`
  ${typography.Sans14}
  color: ${palette.pine1};
  line-height: 1.6;
  margin: 0;
`;

export const EmptyState = styled.div`
  ${typography.Sans14}
  color: ${palette.slate60};
  padding: ${rem(16)} ${rem(20)};
  text-align: center;
`;
