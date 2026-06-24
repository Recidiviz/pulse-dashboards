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

import { Text, View } from "@react-pdf/renderer";
import React from "react";

import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";

/**
 * Outlined container for the Employment / Substance-Use tables. Draws the box
 * on three sides (top + left + right) only; the header and each body row supply
 * their own `borderBottom`, so the last row's bottom rule forms the box's bottom
 * edge with no doubled hairline.
 */
export const Table: React.FC<{
  children: React.ReactNode;
  style?: PdfStyle;
}> = ({ children, style = {} }) => (
  <View
    style={[
      {
        marginTop: space[6],
        borderTopWidth: border.width.regular,
        borderLeftWidth: border.width.regular,
        borderRightWidth: border.width.regular,
        borderBottomWidth: border.width.regular,
        borderColor: color.border.strong,
      },
      style,
    ]}
  >
    {children}
  </View>
);

/** Gray header strip of the Employment / Substance-Use tables. */
export const TableHeaderRow: React.FC<{
  children: React.ReactNode;
  style?: PdfStyle;
}> = ({ children, style = {} }) => (
  <View
    style={[
      {
        flexDirection: "row",
        paddingVertical: space[4],
        paddingHorizontal: space[8],
        borderBottomWidth: border.width.regular,
        borderBottomColor: color.border.strong,
      },
      style,
    ]}
  >
    {children}
  </View>
);

/** Bold column-title cell inside a TableHeaderRow; size via `style={{flex: N}}`. */
export const TableHeaderCell: React.FC<{
  children: React.ReactNode;
  style?: PdfStyle;
}> = ({ children, style = {} }) => (
  <Text
    style={[
      {
        fontWeight: font.weight.bold,
        fontSize: font.size.sm,
        color: color.text.default,
      },
      style,
    ]}
  >
    {children}
  </Text>
);

/** Body row with the bottom rule of the Employment / Substance-Use tables. */
export const TableRow: React.FC<{
  children: React.ReactNode;
  style?: PdfStyle;
}> = ({ children, style = {} }) => (
  <View
    style={[
      {
        flexDirection: "row",
        paddingVertical: space[4],
        paddingHorizontal: space[8],
        borderBottomWidth: border.width.hairline,
        borderBottomColor: color.rule,
      },
      style,
    ]}
  >
    {children}
  </View>
);
