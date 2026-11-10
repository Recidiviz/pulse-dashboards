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

import { palette, spacing } from "../../../../styles";

export const PanelRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 ${spacing[4]};
  width: 100%;
`;

export const PanelBody = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[6]};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 ${spacing[4]} ${spacing[4]} ${spacing[4]};
  width: 100%;
`;
