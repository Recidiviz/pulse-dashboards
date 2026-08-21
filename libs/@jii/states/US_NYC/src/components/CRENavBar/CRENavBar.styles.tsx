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

import { rem } from "polished";
import styled from "styled-components";

import { HIDDEN_HEADER_OFFSET, STICKY_HEADER_ZINDEX } from "~@jii/common-ui";
import { palette, spacing } from "~design-system";

export const NavBar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${STICKY_HEADER_ZINDEX};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: ${rem(HIDDEN_HEADER_OFFSET)};
  padding: 0 ${rem(spacing.lg)};
  background: ${palette.white};
  border-bottom: 1px solid ${palette.slate20};
`;
