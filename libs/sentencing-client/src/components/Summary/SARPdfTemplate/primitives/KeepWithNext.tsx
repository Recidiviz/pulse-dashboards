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

import { View } from "@react-pdf/renderer";
import React from "react";

import { space } from "../tokens";

/**
 * Moves its children to the next page unless at least `minPresenceAhead`
 * points of the content after them fit on the current page, so a heading never
 * ends a page without its content.
 *
 * Two react-pdf behaviours make the obvious <View minPresenceAhead> unreliable:
 * - It ignores minPresenceAhead on the first child of a View, because it only
 *   moves a node to the next page when something precedes it in the same
 *   parent. The empty View ahead of the children makes sure something always
 *   does. It has no size, so it doesn't change the layout.
 * - It ignores minPresenceAhead when the node itself crosses the page bottom,
 *   and a first child that can't be split is then left on the page, running
 *   into the footer. wrap={false} moves the children to the next page whole
 *   instead.
 */
export const KeepWithNext: React.FC<{
  minPresenceAhead?: number;
  children: React.ReactNode;
}> = ({ minPresenceAhead = space.headingMinPresence, children }) => (
  <>
    <View />
    <View wrap={false} minPresenceAhead={minPresenceAhead}>
      {children}
    </View>
  </>
);
