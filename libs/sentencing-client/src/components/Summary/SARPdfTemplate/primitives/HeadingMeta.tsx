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

import { Text } from "@react-pdf/renderer";
import React from "react";

import { font, space } from "../tokens";

/**
 * Assessment context ("Administered By: X, date | Age at Assessment: N") on
 * its own line beneath a section heading, padded to keep the content that
 * follows from crowding it.
 */
export const HeadingMeta: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Text
    style={{
      fontSize: font.size.base,
      fontWeight: font.weight.medium,
      paddingTop: space[4],
      paddingBottom: space[8],
    }}
  >
    {children}
  </Text>
);
