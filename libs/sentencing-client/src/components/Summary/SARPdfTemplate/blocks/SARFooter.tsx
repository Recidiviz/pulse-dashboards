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

import { formatPersonName } from "../../../../utils/utils";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";

/**
 * Fixed footer, declared once as a direct child of `<Page>` — react-pdf repeats
 * it on every physical page and re-runs the render callback with that page's
 * number. Reads the SAR from context.
 */
export const SARFooter: React.FC<{ style?: PdfStyle }> = ({ style = {} }) => {
  const { sar } = useSAR();
  const causes = sar.charges
    .map((c) => c.causeNum)
    .filter(Boolean)
    .map((n) => `#${n}`)
    .join(", ");

  const footerText = `Defendant: ${sar.client?.fullName ? formatPersonName(sar.client?.fullName) : "Unknown"} | Cause: ${causes}`;
  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "space-between",
          position: "absolute",
          fontSize: font.size.md,
          bottom: 9,
          left: 0,
          right: 0,
          textAlign: "center",
          color: color.text.default,
          borderTopWidth: border.width.regular,
          borderTopColor: color.border.faint,
          paddingTop: space[8],
          paddingLeft: space.pageMargin.x,
          paddingRight: space.pageMargin.x,
        },
        style,
      ]}
      fixed
    >
      <Text
        style={{
          width: "90%",
          textOverflow: "ellipsis",
          textAlign: "left",
          overflow: "hidden",
          flexWrap: "nowrap",
        }}
      >
        {footerText.length > 90 ? `${footerText.slice(0, 90)}...` : footerText}
      </Text>
      <Text
        style={{
          // Dynamic (render-callback) nodes don't inherit the Page font during
          // their per-page relayout — without an explicit family this falls
          // back to Helvetica.
          fontFamily: font.family,
          fontSize: font.size.md,
        }}
        render={({ pageNumber }) => `Page ${pageNumber}`}
      />
    </View>
  );
};
