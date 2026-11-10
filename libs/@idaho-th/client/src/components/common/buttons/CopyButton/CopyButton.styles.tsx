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

import { buttonOutline } from "../../StyledComponents";

export const CopyIconButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: none;
  cursor: pointer;
  display: flex;
  height: 1.125rem;
  justify-content: center;
  padding: 0;
  width: 1.125rem;

  & svg {
    height: 100%;
    width: 100%;
  }

  &:hover {
    opacity: 0.7;
  }
`;
