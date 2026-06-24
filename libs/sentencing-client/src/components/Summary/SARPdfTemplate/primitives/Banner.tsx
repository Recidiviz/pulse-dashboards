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

/** Cream banner heading — scoped to Community / Institutional Strategies. */
export const Banner: React.FC<{
  title: string;
  style?: PdfStyle;
  children: React.ReactNode;
}> = ({ title, style = {}, children }) => (
  <View
    style={[
      {
        backgroundColor: color.surface.banner,
        paddingVertical: space[8],
        paddingHorizontal: space[8],
        marginTop: space[10],
        marginBottom: space[6],
      },
      style,
    ]}
    wrap={false}
  >
    <Text
      style={{
        textAlign: "center",
        fontSize: font.size.xxxl,
        fontWeight: font.weight.bold,
        color: color.text.default,
        marginVertical: space[10],
      }}
    >
      {title}
    </Text>
    {children}
  </View>
);
