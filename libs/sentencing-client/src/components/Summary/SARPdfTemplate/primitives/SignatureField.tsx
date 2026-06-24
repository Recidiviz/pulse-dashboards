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

/** Bold label followed by a fill-in underline ("Printed Name:", "Date:"). */
export const SignatureField: React.FC<{ label: string; style?: PdfStyle }> = ({
  label,
  style = {},
}) => (
  <View
    style={[
      { flexDirection: "row", alignItems: "flex-end", marginBottom: space[12] },
      style,
    ]}
  >
    <Text
      style={{
        fontSize: font.size.md,
        fontWeight: font.weight.bold,
        marginRight: space[6],
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flex: 1,
        borderBottomWidth: border.width.hairline,
        borderBottomColor: color.text.default,
        height: 12,
      }}
    />
  </View>
);
