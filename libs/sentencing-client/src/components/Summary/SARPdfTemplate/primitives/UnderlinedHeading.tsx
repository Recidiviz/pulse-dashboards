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
 * Primary section heading — uppercase bold title with a 1pt full-width
 * underline rule beneath. Optional right-aligned meta text shares the title's
 * baseline (e.g. "Requested 11/12/25 | Completed 11/24/25" on REQUESTED OF).
 */
export const UnderlinedHeading: React.FC<{
  children: React.ReactNode;
  meta?: React.ReactNode;
  style?: PdfStyle;
}> = ({ children, meta, style = {} }) => (
  <View
    style={[
      {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingBottom: space[4],
        marginBottom: space[6],
        borderBottomWidth: border.width.regular,
        borderBottomColor: color.text.default,
      },
      style,
    ]}
  >
    <Text
      style={{
        fontSize: font.size.md,
        fontWeight: font.weight.bold,
        textTransform: "uppercase",
        letterSpacing: font.letterSpacing.wide,
      }}
    >
      {children}
    </Text>
    {meta ? (
      <Text
        style={{
          fontSize: font.size.sm,
          fontWeight: font.weight.medium,
          color: color.text.default,
        }}
      >
        {meta}
      </Text>
    ) : null}
  </View>
);
