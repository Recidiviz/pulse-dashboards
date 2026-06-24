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

/**
 * Inline label-then-value row used inside offense cards. Label is bold and
 * left-aligned in a fixed-width column; value flows to the right of it.
 * Distinct from FieldCell (which stacks label above value).
 */
export const FieldRow: React.FC<{
  label: string;
  value: React.ReactNode;
  style?: PdfStyle;
}> = ({ label, value, style = {} }) => (
  <View style={[{ flexDirection: "row", marginBottom: space[4] }, style]}>
    <Text style={{ fontSize: font.size.base, fontWeight: font.weight.bold }}>
      {label + " "}
    </Text>
    <Text
      style={{
        flex: 1,
        fontSize: font.size.base,
        fontWeight: font.weight.medium,
      }}
    >
      {value}
    </Text>
  </View>
);
