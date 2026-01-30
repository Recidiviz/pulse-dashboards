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

import { palette } from "~design-system";

export const DonutContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const CenterText = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

export const RiskLevelLabel = styled.span`
  color: ${palette.pine1};
  text-align: center;
  font-family: "Public Sans";
  font-size: 0.919rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.009rem;
`;

export const ScoreText = styled.span`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1.072rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.011rem;
`;
