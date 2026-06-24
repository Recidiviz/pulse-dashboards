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

import { printFormattedRecordString } from "../../../../utils/utils";
import { RecordsChip } from "../primitives/RecordsChip";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";
import { InsightSubject } from "./InsightSubject";

const BAR_HEIGHT = 20;
const CAP_WIDTH = 1.5;

/**
 * "Average Time Served" Historical Outcome card — same card chrome as
 * SentenceDistribution; Start/End labels above the bar, a solid fill +
 * continuous dashed continuation, and the filled %/100% labels beneath. A
 * presentational leaf: receives already-derived data.
 */
export const AverageTimeServed: React.FC<{
  style?: PdfStyle;
}> = ({ style = {} }) => {
  const { insight } = useSAR();

  if (!insight || !insight?.avgPctServed) {
    return null;
  }

  const filledPct = Math.max(0, Math.min(100, insight?.avgPctServed));
  const remainderPct = 100 - filledPct;
  const numRecords = insight.timeServedNumRecords ?? 0;
  const descriptionContext = {
    gender: insight.gender,
    assessmentScoreBucketStart: insight.assessmentScoreBucketStart,
    offense: insight.offense,
    offenseCategory: insight.offenseCategory,
  };
  return (
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
          Average Time{"\n"}Served
        </Text>
        <Text
          style={{
            fontSize: font.size.xxs,
            lineHeight: font.lineHeight.normal,
            color: color.text.default,
          }}
        >
          Average Time Served shows the average amount of time{" "}
          <InsightSubject context={descriptionContext} /> were incarcerated
          before being granted parole. Incarceration includes jail time credited
          as well as time spent in prison. The rates are based on{" "}
          {numRecords.toLocaleString()} {printFormattedRecordString(numRecords)}{" "}
          of such cases, using MODOC data from 2017 to present.
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
          count={insight.timeServedNumRecords || 0}
        />
        <Text
          style={{
            fontSize: font.size.lg,
            fontWeight: font.weight.bold,
            marginTop: space[10],
            marginBottom: space[16],
          }}
        >
          Average time served:{" "}
          <Text style={{ fontWeight: font.weight.medium }}>
            {insight.avgPctServed}%
          </Text>
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: space[2],
            marginBottom: space[2],
          }}
        >
          <Text style={{ fontSize: font.size.sm, color: color.text.muted }}>
            Start
          </Text>
          <Text style={{ fontSize: font.size.sm, color: color.text.muted }}>
            End
          </Text>
        </View>
        {/* Bar mirrors the Figma: a 30%-black fill bracketed by black caps at
            Start (0%) and the fill end, a centered dashed continuation, and a
            black End cap at 100%. Widths are percentages of the column so the
            fill end lands exactly at the average regardless of column width;
            the caps are fixed-width Views so they stay crisp at any width. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: BAR_HEIGHT,
          }}
        >
          <View
            style={{
              width: `${filledPct}%`,
              height: BAR_HEIGHT,
              backgroundColor: color.bar.fillFaint,
              borderColor: color.text.default,
              borderLeftWidth: CAP_WIDTH,
              borderRightWidth: CAP_WIDTH,
            }}
          />
          {remainderPct > 0 ? (
            <View
              style={{
                flex: 1,
                height: BAR_HEIGHT,
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: "100%",
                  borderTopWidth: border.width.regular,
                  borderTopColor: color.text.muted,
                  borderStyle: "dashed",
                }}
              />
            </View>
          ) : null}
          {remainderPct > 0 ? (
            <View
              style={{
                width: CAP_WIDTH,
                height: BAR_HEIGHT,
                backgroundColor: color.text.default,
              }}
            />
          ) : null}
        </View>
        <View style={{ flexDirection: "row", marginTop: space[4] }}>
          <Text
            style={{
              fontSize: font.size.sm,
              fontWeight: font.weight.bold,
              color: color.text.default,
              textAlign: "right",
              width: `${filledPct}%`,
            }}
          >
            {insight.avgPctServed}%
          </Text>
          <Text
            style={{
              fontSize: font.size.sm,
              color: color.text.muted,
              textAlign: "right",
              width: `${remainderPct}%`,
            }}
          >
            100%
          </Text>
        </View>
      </View>
    </View>
  );
};
