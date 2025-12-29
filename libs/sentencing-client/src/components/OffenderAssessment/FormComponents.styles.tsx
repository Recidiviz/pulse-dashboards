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

import styled from "styled-components";

import { Icon, IconSVG, iconToDataURI, palette } from "~design-system";

export const CHEVRON_DOWN_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG["ChevronDown"]} color={palette.pine1} />,
);

export const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Label = styled.label`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.01rem;
`;

const inputStyles = `
  display: flex;
  min-height: 2.5rem;
  padding: 0.75rem 1rem;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  border-radius: 0.5rem;
  border: 1px solid rgba(43, 84, 105, 0.20);
  font-family: "Public Sans";
  font-size: 0.875rem;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: ${palette.pine4};
  }

  &::placeholder {
    color: ${palette.slate40};
  }
`;

export const Input = styled.input<{ halfWidth?: boolean }>`
  ${inputStyles}
  ${({ halfWidth }) => halfWidth && "width: 50%;"}
`;

export const Select = styled.select`
  ${inputStyles}
  appearance: none;
  background-image: url("${CHEVRON_DOWN_BACKGROUND}");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
  cursor: pointer;
`;
