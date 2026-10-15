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
import { font, space } from "../tokens";

/**
 * Inline label-then-value row used inside offense cards. The bold label and
 * the value share one text run, so a long value wraps back to the left edge
 * under the label instead of leaving a gap beneath it.
 * Distinct from FieldCell (which stacks label above value).
 */
export const FieldRow: React.FC<{
  label: string;
  value: React.ReactNode;
  style?: PdfStyle;
}> = ({ label, value, style = {} }) => (
  <Text
    style={[
      {
        marginBottom: space[4],
        fontSize: font.size.base,
        fontWeight: font.weight.medium,
      },
      style,
    ]}
  >
    <Text style={{ fontWeight: font.weight.bold }}>{label + " "}</Text>
    {value}
  </Text>
);
