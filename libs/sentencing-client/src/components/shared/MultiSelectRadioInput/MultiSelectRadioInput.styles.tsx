// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { typography } from "@recidiviz/design-system";
import styled from "styled-components";

import { palette } from "~design-system";

import { customPalette } from "../../styles/palette";

export const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-bottom: 12px;
  width: 100%;
`;

export const Title = styled.h3`
  ${typography.Sans16}
  color: ${palette.pine1};
  font-weight: 600;
  width: 85%;
  margin: 0;
`;

export const SkipContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SkipCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: ${palette.pine4};
  cursor: pointer;
`;

export const SkipLabel = styled.label`
  ${typography.Sans14}
  color: ${palette.slate85};
  cursor: pointer;
  padding-top: 0.35rem;
`;

export const HelperText = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin-bottom: 12px;
`;

export const MultiSelectContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  gap: 4px;
  margin-bottom: 16px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
`;

export const SelectChip = styled.div<{
  selected?: boolean;
  isNotSureYetOption: boolean;
  disabled?: boolean;
}>`
  width: fit-content;
  display: flex;
  align-items: center;
  padding: 9px 12px;
  gap: 6px;
  background-color: ${({ selected }) =>
    selected ? customPalette.green.light3 : "none"};
  color: ${({ selected, disabled }) => {
    if (disabled) return palette.slate40;
    if (selected) return palette.pine3;
    return palette.slate85;
  }};
  border: 1px solid
    ${({ selected }) => (selected ? palette.pine4 : palette.slate20)};
  border-radius: 32px;
  ${typography.Sans14}

  &:hover {
    cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  }

  ${({ selected, isNotSureYetOption }) =>
    selected &&
    isNotSureYetOption &&
    `
      background-color: ${customPalette.green.light2};
      border: 1px solid ${palette.slate20};
      path {
        fill: ${palette.slate60};
      }
  `}
`;

export const OtherTextArea = styled.textarea`
  ${typography.Sans14}
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid ${palette.slate20};
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 16px;

  &:focus {
    outline: none;
    border-color: ${palette.pine4};
  }

  &::placeholder {
    color: ${palette.slate40};
  }
`;
