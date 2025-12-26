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

export const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-bottom: 12px;
  width: 100%;
`;

export const Title = styled.h3`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1.125rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.0225rem;
  width: 90%;
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
