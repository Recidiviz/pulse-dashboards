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

export const RadioContainer = styled.label`
  display: block;
  position: relative;
  padding-left: 1.75rem;
  min-height: 1rem;
  margin-bottom: 1rem;
  user-select: none;
  cursor: pointer;
  color: ${({ theme }) => theme.checkbox?.labelColor ?? palette.pine1};

  &:focus,
  &:focus-within,
  &:active {
    span:last-child {
      border: 1px solid
        ${({ theme }) => theme.checkbox?.checkedColor ?? palette.pine3};
    }
  }
`;

export const RadioLabel = styled.span`
  position: relative;
  top: -4px;
  ${({ theme }) => theme.checkbox?.labelTypography}
`;

export const RadioInput = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

export const RadioDot = styled.span<{ $checked: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 1rem;
  width: 1rem;
  border: 1px solid ${palette.slate30};
  border-radius: 1rem;
  background: transparent;

  &::after {
    content: "";
    position: absolute;
    display: ${({ $checked }) => ($checked ? "block" : "none")};
    left: 3px;
    top: 3px;
    width: 8px;
    height: 8px;
    background: ${({ theme }) => theme.checkbox?.checkedColor ?? palette.pine3};
    border-radius: 1000px;
    border: 0;
  }
`;
