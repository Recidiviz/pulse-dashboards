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

import {
  CheckboxBox,
  CheckboxContainer,
} from "../CheckboxGroup/CheckboxGroup.styles";

export const FilterTitleRow = styled.div`
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

export const FilterTitle = styled.span`
  ${({ theme }) => theme.checkbox?.labelTypography}
  font-weight: 700;
  line-height: 100%;
  letter-spacing: 0%;
  color: ${({ theme }) => theme.checkbox?.titleColor ?? palette.pine1};
`;
