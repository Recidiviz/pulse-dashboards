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

import { palette } from "~design-system";

const PILL_WIDTH = "80px";

export const TogglePillContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
`;

export const TogglePillButton = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${PILL_WIDTH};
  height: 2.33rem;
  border: 1px solid ${({ theme }) => theme.togglePill?.borderColor ?? "#d2d8d8"};
  background: ${({ $selected, theme }) =>
    $selected
      ? theme.togglePill?.selectedBackgroundColor ?? "#006c67"
      : "transparent"};
  color: ${({ $selected, theme }) =>
    $selected
      ? theme.togglePill?.selectedTextColor ?? "white"
      : theme.togglePill?.textColor ?? palette.pine3};
  padding: 0 1rem;
  ${({ theme }) => theme.togglePill?.labelTypography}
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:first-of-type {
    border-right: none;
    border-radius: 200px 0 0 200px;
  }

  &:last-of-type {
    border-left: none;
    border-radius: 0 200px 200px 0;
  }

  &:focus,
  &:focus-within,
  &:active,
  &:hover {
    border: 1px solid
      ${({ theme }) => theme.togglePill?.focusBorderColor ?? "#006c67"};
  }
`;
