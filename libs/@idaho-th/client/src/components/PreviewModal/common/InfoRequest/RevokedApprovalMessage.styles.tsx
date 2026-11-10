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

import { Caption2, palette, spacing } from "../../../../styles";
import { ScrollableText } from "./InfoRequest.styles";

export const RevokedRoot = styled.div`
  align-items: flex-start;
  border-left: 1px solid ${palette.border.subtle};
  display: flex;
  gap: ${spacing[2]};
  padding-left: ${spacing[2]};
  justify-content: space-between;
  width: 100%;
`;

export const RevokedColumn = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[1]};
  min-width: 0;
`;

export const RevokedLabel = styled(Caption2)`
  color: ${palette.foreground.secondary};
`;

// ScrollableText is built for a row layout; in this column it should size to its content.
export const RevokedReason = styled(ScrollableText)`
  flex: none;
`;
