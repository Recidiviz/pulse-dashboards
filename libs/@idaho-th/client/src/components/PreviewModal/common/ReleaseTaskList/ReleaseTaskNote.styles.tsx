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

import styled from "styled-components";

import {
  BodyS1,
  borderRadius,
  Caption1,
  palette,
  spacing,
} from "../../../../styles";

export const NoteWrapper = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  width: 100%;
`;

export const NoteInput = styled.input<{ $focused?: boolean }>`
  font-family: "Inter", Helvetica, sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;

  background: ${palette.background.secondary};
  border-radius: ${borderRadius[8]};
  border: 0.0625rem solid
    ${({ $focused }) =>
      $focused ? palette.background.brand : palette.border.subtle};
  box-shadow: ${({ $focused }) => ($focused ? palette.shadow.brand : "none")};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  padding: ${spacing[3]};
  width: 100%;

  &:focus,
  &:focus-visible {
    outline: none;
  }

  &::placeholder {
    color: ${palette.foreground.secondary};
  }

  &:disabled {
    color: ${palette.foreground.primary};
    cursor: default;
  }
`;

export const NoteCaption = styled(Caption1)`
  color: ${palette.foreground.secondary};
`;

export const ProviderNoteWrapper = styled.div`
  display: flex;
  padding-left: ${spacing[6]};
  width: 100%;
`;

export const ProviderNoteText = styled(BodyS1)<{ $hasNote?: boolean }>`
  color: ${({ $hasNote }) =>
    $hasNote ? palette.foreground.primary : palette.foreground.secondary};
  font-style: italic;
`;
