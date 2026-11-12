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

import { Serif34 } from "~design-system";

import { semantics } from "../../theme";

const { text } = semantics;

/**
 * A page title, such as the month on the Public Calendar screen: the
 * ~design-system Serif34 component in the primary text colour. It follows the
 * staff app's Heading (apps/staff/src/core/sharedComponents.ts), which these
 * libraries can't import, without its mobile size and bottom padding, so the
 * parent sets the spacing. Render it with as="h1" or the level the page needs.
 */
export const Heading = styled(Serif34)`
  margin: 0;
  color: ${text.primary};
`;
