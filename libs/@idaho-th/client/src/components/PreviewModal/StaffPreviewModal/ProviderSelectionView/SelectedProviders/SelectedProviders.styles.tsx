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

import { borderRadius, palette, spacing } from "../../../../../styles";

export const SelectedProvidersWrapper = styled.div`
  display: flex;
  padding: ${spacing[3]};
  flex-direction: column;
  align-items: flex-start;
  gap: ${spacing[2]};
  align-self: stretch;
  border-radius: ${borderRadius[32]};
  background: ${palette.background.secondary};
`;

export const SelectedProvidersRoot = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[2]};
  width: 100%;
`;
