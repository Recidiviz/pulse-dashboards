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

import { palette, typography } from "~design-system";

/**
 * Styled primitives for a list of case notes,
 * each row opening the note in CaseNoteModal.
 */

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

/**
 * Renders a note body in full. Each caller decides how to shorten the
 * preview, since they disagree: US_ID clamps by line, US_MO by word count.
 */
export const NoteBody = styled.p`
  ${typography.Sans14}
  color: ${palette.pine1};
  line-height: 1.6;
  margin: 0;
`;
