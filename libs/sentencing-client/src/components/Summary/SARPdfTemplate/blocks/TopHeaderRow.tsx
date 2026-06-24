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

import { formatJudgeName, formatPersonName } from "../../../../utils/utils";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";

const HeaderCell: React.FC<{
  label: string;
  value: string;
  style?: PdfStyle;
}> = ({ label, value, style = {} }) => (
  <View
    style={[
      {
        paddingTop: space[4],
        paddingBottom: space[4],
        paddingHorizontal: space[10],
      },
      style,
    ]}
  >
    <Text style={{ fontSize: font.size.xxs, color: color.text.default }}>
      {label}
    </Text>
    <Text style={{ fontSize: font.size.xxxl, fontWeight: font.weight.medium }}>
      {value}
    </Text>
  </View>
);

export const TopHeaderRow: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  const judge = sar.requestingJudgeName
    ? `Honorable ${formatJudgeName(sar.requestingJudgeName)}`
    : "—";
  return (
    <View
      style={[
        {
          flexDirection: "row",
          borderWidth: border.width.thin,
          borderColor: color.border.strong,
          borderRadius: border.radius.md,
        },
        style,
      ]}
    >
      <HeaderCell
        label="Defendant"
        value={
          sar.client?.fullName
            ? formatPersonName(sar.client?.fullName)
            : "Unknown"
        }
        style={{
          borderRightWidth: border.width.thin,
          borderRightColor: color.border.strong,
          flex: 1,
        }}
      />
      <HeaderCell
        label="To"
        value={`${judge} / ${sar.division ?? "—"}`}
        style={{
          borderRightWidth: border.width.thin,
          borderRightColor: color.border.strong,
          flex: 1,
        }}
      />
      <HeaderCell
        label="Case Number"
        value={`#${sar.externalId}`}
        style={{ flex: 1 }}
      />
    </View>
  );
};
