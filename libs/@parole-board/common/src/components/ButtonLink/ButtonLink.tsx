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

import { baseButtonStyles, secondaryButtonStyles } from "~design-system";

import { semantics } from "../../theme";

const { radius, space } = semantics;

// TODO(CO-935): Waiting on ~design-system to give Button a link form that takes an href. Replace this with it once it lands.
/**
 * A link that looks like the ~design-system secondary Button in its block
 * shape, for an action that opens a page, such as View public page on the
 * published banner. It renders an anchor, so the address shows on hover and
 * middle-click opens it in a new tab, which a button can't do. The block
 * shape's size, padding and radius are copied from the DS Button, which
 * doesn't export them.
 */
export const ButtonLink = styled.a`
  ${baseButtonStyles}
  ${secondaryButtonStyles}

  display: inline-flex;
  box-sizing: border-box;
  min-width: ${rem(32)};
  min-height: ${rem(32)};
  padding: ${rem(space.xs)} ${rem(space.sm)};
  border-radius: ${radius.control};
  text-decoration: none;
`;
