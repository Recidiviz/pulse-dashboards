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

import { RiskLevelKey } from "../../../OffenderAssessment/constants";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { color, font, space } from "../tokens";
import { RiskPipBadge } from "./RiskPipBadge";

/** Gray banner heading with optional right-aligned meta text / risk badge. */
export const SectionHeading: React.FC<{
  title: string;
  meta?: string;
  /** When provided, renders the pip + risk badge at the right edge of the banner. */
  risk?: RiskLevelKey | null;
  style?: PdfStyle;
}> = ({ title, meta, risk, style = {} }) => (
  <View
    style={[
      {
        backgroundColor: color.surface.section,
        fontWeight: font.weight.semibold,
        paddingVertical: space[4],
        paddingHorizontal: space[10],
        marginTop: space.sectionGap,
        marginBottom: space[4],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      style,
    ]}
  >
    <Text style={{ fontSize: font.size.xs }}>{title}</Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: space[8] }}>
      {meta ? (
        <Text
          style={{
            fontWeight: font.weight.regular,
            fontSize: font.size.xs,
          }}
        >
          {meta}
        </Text>
      ) : null}
      {risk ? <RiskPipBadge level={risk} /> : null}
    </View>
  </View>
);
