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

import { palette, spacing } from "../../../../../styles";
import { ProviderCardWrapper } from "../../common/styledComponents";

export const SelectedCardWrapper = styled(ProviderCardWrapper)`
  align-items: stretch;
  gap: 0;
  overflow: hidden;
  padding: 0;
`;

export const TealStrip = styled.div`
  align-self: stretch;
  background: ${palette.background.brand};
  flex: none;
  width: 7px;
`;

export const CardContent = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: ${spacing[3]};
  justify-content: space-between;
  min-width: 0;
  padding: ${spacing[4]} ${spacing[4]} ${spacing[4]} ${spacing[3]};
`;
