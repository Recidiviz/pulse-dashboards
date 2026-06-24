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

import { formatMonthYear } from "../../../../utils/utils";
import {
  Table,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "../primitives/TableRow";
import type { PdfStyle, SAR } from "../SARPdfTemplate.types";
import { font } from "../tokens";
import { valueOrDash as v, yesNoOrDash } from "../utils";

type EmploymentRow = SAR["employmentHistories"][number];

const dateRange = (row: EmploymentRow): string => {
  const start = row.startDate ? formatMonthYear(row.startDate) : "—";
  const end = row.endDate ? formatMonthYear(row.endDate) : "—";
  return `${start} - ${end}`;
};

export const EmploymentTable: React.FC<{
  rows: EmploymentRow[];
  style?: PdfStyle;
}> = ({ rows, style = {} }) => (
  <Table style={style}>
    <TableHeaderRow>
      <TableHeaderCell style={{ flex: 3 }}>Name of Employer</TableHeaderCell>
      <TableHeaderCell style={{ flex: 2 }}>Start/End Date</TableHeaderCell>
      <TableHeaderCell style={{ flex: 2 }}>
        Verified by Report Author*
      </TableHeaderCell>
    </TableHeaderRow>
    {rows.map((r, i) => (
      <TableRow
        key={i}
        style={{ borderBottomWidth: i < rows.length - 1 ? 1 : 0 }}
      >
        <Text style={{ fontSize: font.size.base, flex: 3 }}>
          {v(r.employerName)}
        </Text>
        <Text style={{ fontSize: font.size.base, flex: 2 }}>
          {dateRange(r)}
        </Text>
        <Text style={{ fontSize: font.size.base, flex: 2 }}>
          {yesNoOrDash(r.verifiedByReportAuthor)}
        </Text>
      </TableRow>
    ))}
  </Table>
);
