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

import { CheckboxGroup as DSCheckboxGroup, palette } from "~design-system";

/**
 * Themed wrapper around the design-system CheckboxGroup that preserves the
 * Pathways grid layout and applies the consumer's `theme.checkbox.*` styles
 * to the design-system Checkbox internals via stable class names.
 */
export const PathwaysCheckboxGroup = styled(DSCheckboxGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.25rem 1rem;

  &:has(:focus-visible) {
    box-shadow:
      -1px 1px 1px 1px
        ${({ theme }) => theme.palette?.focusColor ?? palette.signal.links},
      1px -1px 1px 1px ${({ theme }) => theme.palette?.focusColor ?? palette.signal.links};
  }

  input[data-cg-item="true"]:focus-visible + .ds-checkbox__indicator {
    outline-color: ${({ theme }) =>
      theme.palette?.focusColor ?? palette.signal.links};
  }

  .ds-checkbox {
    color: ${({ theme }) => theme.checkbox?.labelColor ?? palette.pine1};
    margin-bottom: 0.25rem;
  }

  .ds-checkbox__label {
    ${({ theme }) => theme.checkbox?.labelTypography}
  }

  .ds-checkbox__indicator {
    border-radius: 3px;
    border-color: ${({ theme }) =>
      theme.checkbox?.borderColor ?? palette.slate30};
    background: transparent;
  }

  .ds-checkbox:has(input:checked) .ds-checkbox__indicator,
  .ds-checkbox:has(input:indeterminate) .ds-checkbox__indicator {
    background: ${({ theme }) => theme.checkbox?.checkedColor ?? palette.pine3};
    border-color: ${({ theme }) =>
      theme.checkbox?.checkedColor ?? palette.pine3};
  }

  .ds-checkbox:hover .ds-checkbox__indicator,
  .ds-checkbox:focus-within .ds-checkbox__indicator {
    border-color: ${({ theme }) =>
      theme.checkbox?.checkedColor ?? palette.pine3};
  }
`;

export const HeaderRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const ShowMoreButton = styled.button`
  ${({ theme }) => theme.typography.Sans14}
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-top: 1rem;
  outline: none;

  &:hover {
    text-decoration: underline;
    color: ${({ theme }) =>
      theme.checkbox?.checkedColor ?? palette.signal.links};
  }

  &:focus-visible {
    outline: 2px solid
      ${({ theme }) => theme.checkbox?.checkedColor ?? palette.signal.links};
    outline-offset: 2px;
  }
`;
