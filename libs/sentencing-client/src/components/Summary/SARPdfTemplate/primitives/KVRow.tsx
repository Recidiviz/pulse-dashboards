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
import { font, space } from "../tokens";

/** Key-value row with a wide fixed-width bold label (ORAS domain bodies). */
export const KVRow: React.FC<{
  label: string;
  value: React.ReactNode;
  style?: PdfStyle;
}> = ({ label, value, style = {} }) => (
  <View style={[{ flexDirection: "row", paddingVertical: space[4] }, style]}>
    <Text
      style={{
        fontWeight: font.weight.bold,
        fontSize: font.size.base,
        width: 165,
      }}
    >
      {label}
    </Text>
    <Text style={{ flex: 1, fontSize: font.size.base }}>{value}</Text>
  </View>
);
