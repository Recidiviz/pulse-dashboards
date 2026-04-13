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

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownToggle,
  spacing,
} from "~design-system";

export const FilterSection = styled.div`
  background: ${({ theme }) => theme.modal.backgroundColor};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

export const FilterSectionContent = styled.div`
  padding: 1rem 1.5rem;
`;

export const FilterSectionRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

export const ResetButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  ${({ theme }) => theme.typography.Sans14}
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ theme }) => theme.modal.resetColor};
  padding: 0;

  &:hover {
    text-decoration: underline;
    color: ${({ theme }) => theme.palette.focusColor};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.focusColor};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

export const FilterDropdownWrapper = styled(Dropdown)`
  display: block;
  width: 50%;
  min-width: 200px;
  margin-bottom: 0.5rem;
`;

export const FilterDropdownToggle = styled(DropdownToggle)<{
  $hasNonDefaultSelection?: boolean;
}>`
  ${({ theme }) => theme.typography.Sans14}
  width: 100%;
  padding: 8px 16px;
  border: 1px solid
    ${({ $hasNonDefaultSelection, theme }) =>
      $hasNonDefaultSelection
        ? theme.palette.focusColor
        : "rgba(0, 0, 0, 0.15)"};
  border-radius: 50px;
  background: white;
  color: ${({ $hasNonDefaultSelection, theme }) =>
    $hasNonDefaultSelection ? theme.palette.focusColor : "black"};
  font-weight: 400;
  min-width: auto;
  min-height: auto;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 6px;
  outline: none;

  &:hover,
  &:focus-visible {
    background: rgba(0, 0, 0, 0.03);
    color: black;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.focusColor};
    outline-offset: 2px;
  }

  &:active,
  &[aria-expanded="true"] {
    border-color: ${({ theme }) => theme.palette.focusColor};
    color: ${({ theme }) => theme.palette.focusColor};
    background: white;
    outline: none;
  }
`;

export const FilterDropdownMenu = styled(DropdownMenu)`
  transition: opacity 0.1s ease-in-out;
  transform: none;
  max-height: 300px;
  overflow-y: auto;

  button[role="menuitem"] {
    ${({ theme }) => theme.typography.Sans14}
    height: ${rem(spacing.xl)};
    line-height: ${rem(spacing.xl)};
    padding: 0 ${rem(spacing.md)};
    color: black;

    &:focus {
      color: white;
      background-color: ${({ theme }) => theme.palette.focusColor};
    }
  }

  .filter-dropdown-active-item {
    font-weight: 700;
    color: ${({ theme }) => theme.palette.focusColor};

    &:focus {
      color: white;
    }
  }
`;

export const ApplyButton = styled(Button)`
  ${({ theme }) => theme.typography.Sans14}
  background-color: ${({ theme }) => theme.palette.focusColor};
  border-color: ${({ theme }) => theme.palette.focusColor};

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    background-color: ${({ theme }) => theme.palette.focusColor};
    border-color: ${({ theme }) => theme.palette.focusColor};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.focusColor};
    outline-offset: 2px;
  }
`;
