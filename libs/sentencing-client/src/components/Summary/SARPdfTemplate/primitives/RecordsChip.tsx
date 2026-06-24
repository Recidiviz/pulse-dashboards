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

/** Dark "N Records" pill on the Historical Outcome chart cards. */
export const RecordsChip: React.FC<{ count: number; style?: PdfStyle }> = ({
  count,
  style = {},
}) => (
  <Text
    style={[
      {
        alignSelf: "flex-end",
        backgroundColor: color.surface.chip,
        color: color.text.inverse,
        paddingHorizontal: space[12],
        paddingVertical: space[4],
        fontSize: font.size.base,
        fontWeight: font.weight.bold,
        borderRadius: border.radius.sm,
        marginBottom: space[6],
      },
      style,
    ]}
  >
    {count} Records
  </Text>
);
