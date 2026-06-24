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

import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";

/** Outlined metadata pill (Offender / Court Information row). */
export const Chip: React.FC<{
  children: React.ReactNode;
  style?: PdfStyle;
}> = ({ children, style = {} }) => (
  <Text
    style={[
      {
        borderWidth: border.width.thin,
        borderColor: color.border.strong,
        borderRadius: border.radius.md,
        paddingVertical: space[4],
        paddingHorizontal: space[10],
        fontSize: font.size.base,
        backgroundColor: color.surface.pill,
      },
      style,
    ]}
  >
    {children}
  </Text>
);
