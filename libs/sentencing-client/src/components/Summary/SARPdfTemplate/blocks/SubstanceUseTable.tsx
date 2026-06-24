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

// Tabular rows render in a stable order from a data-driven array; array
// indices are safe React keys here.
/* eslint-disable react/no-array-index-key */

import { Text } from "@react-pdf/renderer";
import React from "react";

import { formatDisplayDate } from "../../../../utils/utils";
import {
  FrequencyOfUseLabels,
  MethodOfUseLabels,
  SubstanceTypeLabels,
} from "../../../OffenderAssessment/SubstanceUse/constants";
import {
  Table,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "../primitives/TableRow";
import type { PdfStyle, SAR } from "../SARPdfTemplate.types";
import { font } from "../tokens";
import { valueOrDash as v } from "../utils";

type DrugRow = SAR["drugHistories"][number];

const substanceLabel = (r: DrugRow): string => {
  if (r.substance && r.substance !== "Other")
    return SubstanceTypeLabels[r.substance];
  return (
    r.otherSubstanceName ??
    (r.substance ? SubstanceTypeLabels[r.substance] : "—")
  );
};

export const SubstanceUseTable: React.FC<{
  rows: DrugRow[];
  style?: PdfStyle;
}> = ({ rows, style = {} }) => (
  <Table style={style}>
    <TableHeaderRow>
      <TableHeaderCell style={{ flex: 2 }}>Substance</TableHeaderCell>
      <TableHeaderCell style={{ flex: 1.5 }}>
        Age of Regular Use
      </TableHeaderCell>
      <TableHeaderCell style={{ flex: 1.5 }}>Last Use</TableHeaderCell>
      <TableHeaderCell style={{ flex: 1.5 }}>Heaviest Use</TableHeaderCell>
      <TableHeaderCell style={{ flex: 1 }}>Method</TableHeaderCell>
    </TableHeaderRow>
    {rows.map((r, i) => (
      <TableRow key={i}>
        <Text style={{ fontSize: font.size.base, flex: 2 }}>
          {substanceLabel(r)}
        </Text>
        <Text style={{ fontSize: font.size.base, flex: 1.5 }}>
          {v(r.ageOfRegularUse)}
        </Text>
        <Text style={{ fontSize: font.size.base, flex: 1.5 }}>
          {formatDisplayDate(r.lastUse)}
        </Text>
        <Text style={{ fontSize: font.size.base, flex: 1.5 }}>
          {r.heaviestUse ? FrequencyOfUseLabels[r.heaviestUse] : "—"}
        </Text>
        <Text style={{ fontSize: font.size.base, flex: 1 }}>
          {r.method ? MethodOfUseLabels[r.method] : "—"}
        </Text>
      </TableRow>
    ))}
  </Table>
);
