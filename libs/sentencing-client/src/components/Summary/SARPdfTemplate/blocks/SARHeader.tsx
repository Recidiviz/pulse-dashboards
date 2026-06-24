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
import moment from "moment";
import React from "react";

import type { PdfStyle } from "../SARPdfTemplate.types";
import { color, font, space } from "../tokens";

/**
 * Fixed report-identity header, declared once as a direct child of `<Page>` —
 * react-pdf repeats it on every physical page. The date/time reflect when the
 * report is generated (matching the DOM report), not the SAR's completion date.
 */
export const SARHeader: React.FC<{ style?: PdfStyle }> = ({ style = {} }) => {
  const generatedAt = moment();
  return (
    <View
      style={[
        {
          position: "absolute",
          top: 24,
          left: space.pageMargin.x,
          right: space.pageMargin.x,
          fontSize: font.size.sm,
          fontWeight: font.weight.semibold,
          color: color.text.default,
          justifyContent: "space-between",
          flexDirection: "row",
        },
        style,
      ]}
      fixed
    >
      <Text>
        Missouri Department of Corrections{"\n"}
        Division of Probation and Parole{"\n"}
        Sentencing Assessment Report
      </Text>
      <Text style={{ textAlign: "right" }}>
        {generatedAt.format("MMMM D, YYYY")}
        {"\n"}
        {generatedAt.format("LTS")}
      </Text>
    </View>
  );
};
