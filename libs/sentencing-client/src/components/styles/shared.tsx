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

export const BackLink = styled.div<{ leftMargin?: number }>`
  width: fit-content;
  display: flex;
  align-items: center;
  padding: 0 24px;
  margin-bottom: 16px;
  margin-left: ${({ leftMargin }) => leftMargin ?? -7}px;
  color: ${palette.slate85};
  position: relative;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    border: solid ${palette.slate85};
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(135deg);
    left: 10px;
  }

  &:hover {
    color: ${palette.pine2};

    &::before {
      border-color: ${palette.pine2};
    }
  }
`;
