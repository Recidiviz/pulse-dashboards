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

import {
  formatDisplayDate,
  formatInlineClassification,
  formatJudgeAndDivision,
} from "../../../../utils/utils";
import { FieldRow } from "../primitives/FieldRow";
import type { PdfStyle, SAR } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";
import { valueOrDash as v } from "../utils";

type Charge = SAR["charges"][number];

/**
 * One offense rendered as a gray sub-banner header ("Offense N - MoCode: …")
 * and a two-column inline-field body, with Defense Attorney spanning full width
 * beneath. A per-item leaf — receives one raw charge, not the whole SAR.
 */
export const OffenseBlock: React.FC<{
  charge: Charge;
  index: number;
  style?: PdfStyle;
}> = ({ charge, index, style = {} }) => {
  const headerMeta = charge.moCode ? `MoCode: ${charge.moCode}` : undefined;
  return (
    <View
      style={[
        {
          marginTop: index === 0 ? 0 : 8,
          marginBottom: space[4],
          borderWidth: border.width.regular,
          borderColor: color.border.card,
        },
        style,
      ]}
      wrap={false}
    >
      <View
        style={{
          backgroundColor: color.surface.section,
          paddingVertical: space[4],
          paddingHorizontal: space[4],
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: font.size.sm,
            fontWeight: font.weight.medium,
            textTransform: "uppercase",
            letterSpacing: font.letterSpacing.wide,
          }}
        >
          Offense {index + 1 + " - "}
        </Text>

        {headerMeta ? (
          <Text style={{ fontSize: font.size.xs, color: color.text.default }}>
            {headerMeta}
          </Text>
        ) : null}
      </View>
      <View style={{ padding: space[12] }}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1, marginRight: space[16] }}>
            <FieldRow
              label="Offense:"
              value={`${v(charge.offense)}${formatInlineClassification(charge)}`}
            />
            <FieldRow label="Cause Number:" value={v(charge.causeNum)} />
            <FieldRow label="County:" value={v(charge.county)} />
            <FieldRow
              label="Judge:"
              value={v(formatJudgeAndDivision(charge))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FieldRow
              label="Prosecuting Attorney:"
              value={v(charge.prosecutingAttorney)}
            />
            <FieldRow label="Plea Agreement:" value={v(charge.pleaAgreement)} />
            <FieldRow
              label="Date of Plea/Finding of Guilt:"
              value={formatDisplayDate(charge.pleaDate)}
            />
            <FieldRow
              label="Date of Sentencing:"
              value={formatDisplayDate(charge.sentencingDate)}
            />
          </View>
        </View>
        <FieldRow label="Defense Attorney:" value={v(charge.defenseAttorney)} />
      </View>
    </View>
  );
};
