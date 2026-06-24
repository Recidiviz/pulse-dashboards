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
import { color, font, space } from "../tokens";

/**
 * Light gray sub-banner with a uppercase title on the left and optional meta
 * text on the right. Visually matches the OFFENSE-card header treatment but
 * standalone (no surrounding card).
 */
export const SubBanner: React.FC<{
  left: string;
  right?: string;
  style?: PdfStyle;
}> = ({ left, right, style = {} }) => (
  <View
    style={[
      {
        backgroundColor: color.surface.section,
        paddingVertical: space[4],
        paddingHorizontal: space[10],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      style,
    ]}
  >
    <Text
      style={{
        fontSize: font.size.sm,
        fontWeight: font.weight.bold,
        textTransform: "uppercase",
        letterSpacing: font.letterSpacing.wide,
      }}
    >
      {left}
    </Text>
    {right ? (
      <Text style={{ fontSize: font.size.xs, color: color.text.muted }}>
        {right}
      </Text>
    ) : null}
  </View>
);
