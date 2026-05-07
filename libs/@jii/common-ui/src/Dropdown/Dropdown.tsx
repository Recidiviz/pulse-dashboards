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

import {
  DropdownMenuItem as OriginalDropdownMenuItem,
  DropdownToggle as OriginalDropdownToggle,
  typography,
} from "~design-system";
import { palette } from "~design-system";

export const JIIDropdownToggle = styled(OriginalDropdownToggle)`
  color: inherit;
  height: 100%;
  padding: 0;
`;

export const JIIDropdownMenuItem = styled(OriginalDropdownMenuItem)`
  ${typography.Sans14}

  color: ${palette.pine3};
  height: 3em;
  padding: 0 1.5em;

  &:focus {
    background-color: ${palette.slate10};
    color: ${palette.pine3};
  }

  &:active {
    background-color: ${palette.slate20};
    color: ${palette.pine3};
  }
`;
