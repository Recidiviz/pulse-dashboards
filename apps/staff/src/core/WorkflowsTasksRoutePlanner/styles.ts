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

import { palette, Sans12 } from "~design-system";

export const BaseCheckbox = styled.span`
  display: flex;
  justify-content: center;
  height: ${rem(16)};
  width: ${rem(16)};
  margin-right: ${rem(10)};
  cursor: pointer;
  border: 1px solid;
  border-radius: ${rem(2)};
`;

export const EmptyCheckbox = styled(BaseCheckbox)<{
  $selectable: boolean;
}>`
  border-color: ${palette.slate20};

  ${({ $selectable }) => !$selectable && `cursor: not-allowed;`}
`;

export const NumberedCheckbox = styled(BaseCheckbox)`
  border-color: ${palette.pine4};
  background-color: ${palette.pine4};
  color: ${palette.marble1};
`;

export const CheckboxContents = styled(Sans12)`
  text-align: center;
`;
