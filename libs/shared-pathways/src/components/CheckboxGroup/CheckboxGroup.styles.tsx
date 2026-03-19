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

import styled, { css } from "styled-components";

import { palette, typography } from "~design-system";

export const CheckboxContainer = styled.label`
  display: block;
  position: relative;
  padding-left: 1.5rem;
  min-height: 1rem;
  margin-bottom: 0.25rem;
  user-select: none;
  cursor: pointer;
  color: ${({ theme }) => theme.checkbox?.labelColor ?? palette.pine1};

  &:has(input:disabled) {
    cursor: not-allowed;
  }

  &:focus,
  &:focus-within,
  &:active {
    span:last-child {
      border: 1px solid
        ${({ theme }) => theme.checkbox?.checkedColor ?? palette.pine3};
    }
  }
`;

export const CheckboxLabel = styled.span`
  position: relative;
  top: -2px;
  ${typography.Sans14}
`;

export const CheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
`;

export const CheckboxBox = styled.span<{
  $checked: boolean;
  $disabled: boolean;
  $indeterminate?: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  height: 1rem;
  width: 1rem;
  border: 1px solid ${palette.slate30};
  background: transparent;
  border-radius: 3px;

  &::after {
    content: "";
    position: absolute;
    display: none;
  }

  ${({ $checked, $indeterminate, $disabled, theme }) => {
    const bgColor = $disabled
      ? palette.slate30
      : theme.checkbox?.checkedColor ?? palette.pine3;

    if ($indeterminate) {
      return css`
        background-color: ${bgColor};

        &::after {
          display: block;
          left: 3px;
          top: 6px;
          width: 8px;
          height: 0;
          border: solid white;
          border-width: 0 0 2px 0;
          transform: none;
        }
      `;
    }

    if ($checked) {
      return css`
        background-color: ${bgColor};

        &::after {
          display: block;
          left: 4px;
          top: 1px;
          width: 6px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      `;
    }

    return "";
  }}
`;

export const CheckboxGroupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.25rem 1rem;
`;

export const SelectAllContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  ${CheckboxContainer} {
    margin-bottom: 0;
    padding-left: 1rem;
  }

  ${CheckboxBox} {
    top: 50%;
    transform: translateY(-50%);
  }
`;

export const CheckboxGroupTitle = styled.span`
  ${typography.Sans14}
  font-weight: 700;
  color: ${({ theme }) => theme.checkbox?.titleColor ?? palette.pine1};
`;
