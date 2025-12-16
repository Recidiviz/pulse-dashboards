// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { css } from "styled-components";

import { palette } from "~design-system";

// Custom styles applied on top of design-system defaults
export const jiiButtonStyles = css`
  justify-content: space-between;
  align-items: center;
  gap: 1em;

  min-height: ${rem(42)};
  padding: ${rem(10)} ${rem(18)};
  border-radius: ${rem(21)};

  border: 1px solid ${palette.signal.links};

  &:hover,
  &:focus {
    background-color: ${palette.pine4};
    color: ${palette.white};
  }

  &:active,
  &[aria-expanded="true"] {
    border-color: ${palette.signal.highlight};
    color: ${palette.signal.highlight};
  }

  & > * {
    flex: 0 1 auto;
  }

  /* expect this to be an icon */
  & > svg {
    flex: 0 0 auto;
  }
`;
