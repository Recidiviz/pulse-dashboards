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

// Legend rows render in a stable, data-driven order; array indices are safe
// React keys here.
/* eslint-disable react/no-array-index-key */

import { Text, View } from "@react-pdf/renderer";
import React from "react";

import { printFormattedRecordString } from "../../../../utils/utils";
import type { InsightDescriptionContext } from "../../insightsUtils";
import { Donut } from "../primitives/Donut";
import { LegendGlyphView } from "../primitives/LegendGlyph";
import { RecordsChip } from "../primitives/RecordsChip";
import type {
  PdfStyle,
  SentenceDistributionItem,
} from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";
import { InsightSubject } from "./InsightSubject";

export interface SentenceDistributionData {
  numRecords: number;
  items: SentenceDistributionItem[];
  /** Gender / risk-bucket / offense used to render the descriptive sentence. */
  context: InsightDescriptionContext;
}

/**
 * "Sentence Distribution" Historical Outcome card — bordered light-gray card
 * with copy on the left and the textured donut + legend on the right, matching
 * the canonical Figma (node 2602:743). A presentational leaf: receives
 * already-derived distribution data.
 */
export const SentenceDistribution: React.FC<{
  data: SentenceDistributionData;
  style?: PdfStyle;
}> = ({ data, style = {} }) => (
  <View
    style={[
      {
        flexDirection: "row",
        gap: space[16],
        marginTop: space[10],
        backgroundColor: color.surface.section,
        borderWidth: border.width.hairline,
        borderColor: color.rule,
        borderRadius: border.radius.md,
      },
      style,
    ]}
    wrap={false}
  >
    <View style={{ flex: 0.8, padding: space[10] }}>
      <Text
        style={{
          fontSize: font.size.xxl,
          fontWeight: font.weight.bold,
          marginBottom: space[20],
        }}
      >
        Sentence{"\n"}Distribution
      </Text>
      <Text
        style={{
          fontSize: font.size.xxs,
          lineHeight: font.lineHeight.normal,
          color: color.text.default,
        }}
      >
        Sentence Distribution represents the percentage of cases sentenced to a
        particular disposition. The rates are based on{" "}
        {data.numRecords.toLocaleString()}{" "}
        {printFormattedRecordString(data.numRecords)} of{" "}
        <InsightSubject context={data.context} />, using MODOC data from
        2020-present.
      </Text>
    </View>
    <View
      style={{
        flex: 2,
        backgroundColor: color.surface.card,
        padding: space[10],
      }}
    >
      <RecordsChip
        style={{
          position: "absolute",
          top: 0,
          right: 0,
        }}
        count={data.numRecords}
      />
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space[10] }}
      >
        <Donut size={175} items={data.items} />
        <View style={{ flex: 1 }}>
          {data.items.map((it, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: space[4],
              }}
            >
              <View style={{ width: 11, height: 11, marginRight: space[6] }}>
                <LegendGlyphView glyph={it.glyph} />
              </View>
              <Text style={{ flex: 1, fontSize: font.size.sm }}>
                {it.label}
              </Text>
              <Text
                style={{ fontSize: font.size.sm, fontWeight: font.weight.bold }}
              >
                {it.pct}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  </View>
);
