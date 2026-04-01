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

import React from "react";

import { SAR } from "../../api";
import {
  formatBooleanDisplay,
  formatDateRange,
  formatMonthYear,
} from "../../utils/utils";
import {
  DRUG_HISTORY_COLUMNS,
  formatSubstanceName,
  FrequencyOfUseLabels,
  MethodOfUseLabels,
} from "../OffenderAssessment/SubstanceUse/constants";
import * as Styled from "./SentencingAssessmentReport.styles";

// ─── Generic table ────────────────────────────────────────────────────────────

interface ReportHistoryTableProps {
  columns: readonly string[];
  rows: (string | null)[][];
  footnote?: string;
}

export const ReportHistoryTable: React.FC<ReportHistoryTableProps> = ({
  columns,
  rows,
  footnote,
}) => (
  <Styled.ColumnFlexContainer>
    <Styled.ReportHistoryTableContainer>
      <Styled.ReportHistoryTableHeader>
        {columns.map((col) => (
          <Styled.ReportHistoryTableCell key={col}>
            <strong>{col}</strong>
          </Styled.ReportHistoryTableCell>
        ))}
      </Styled.ReportHistoryTableHeader>
      {rows.map((row, rowIndex) => (
        // Rows are static PDF data with no stable IDs — index is appropriate here.
        // eslint-disable-next-line react/no-array-index-key
        <Styled.ReportHistoryTableRow key={rowIndex}>
          {row.map((cell, cellIndex) => (
            // Cell positions are fixed by column order — index is the only stable key.
            // eslint-disable-next-line react/no-array-index-key
            <Styled.ReportHistoryTableCell key={cellIndex}>
              {cell ?? "—"}
            </Styled.ReportHistoryTableCell>
          ))}
        </Styled.ReportHistoryTableRow>
      ))}
    </Styled.ReportHistoryTableContainer>
    {footnote && (
      <Styled.ReportHistoryTableFootnote>
        {footnote}
      </Styled.ReportHistoryTableFootnote>
    )}
  </Styled.ColumnFlexContainer>
);

// ─── Drug history wrapper ─────────────────────────────────────────────────────

export const ReportDrugHistoryTable: React.FC<{
  drugHistories: SAR["drugHistories"];
}> = ({ drugHistories }) => {
  if (!drugHistories?.length) return null;

  const rows = drugHistories.map((h) => [
    formatSubstanceName(h.substance, h.otherSubstanceName),
    h.ageOfRegularUse != null ? String(h.ageOfRegularUse) : null,
    h.lastUse ? formatMonthYear(h.lastUse) : null,
    h.heaviestUse ? FrequencyOfUseLabels[h.heaviestUse] : null,
    h.method ? MethodOfUseLabels[h.method] : null,
  ]);

  return <ReportHistoryTable columns={DRUG_HISTORY_COLUMNS} rows={rows} />;
};

// ─── Employment history wrapper ───────────────────────────────────────────────

const EMPLOYMENT_COLUMNS = [
  "Name of Employer",
  "Start/End Date",
  "Verified by Report Author*",
];

const EMPLOYMENT_FOOTNOTE =
  "* The defendant's employment was verified through independent documentation (such as paystubs or tax records), direct communication with the employer, or other reliable corroborating evidence.";

export const ReportEmploymentHistoryTable: React.FC<{
  employmentHistories: SAR["employmentHistories"];
}> = ({ employmentHistories }) => {
  if (!employmentHistories?.length) return null;

  const rows = employmentHistories.map((h) => [
    h.employerName,
    formatDateRange(h.startDate, h.endDate),
    formatBooleanDisplay(h.verifiedByReportAuthor),
  ]);

  return (
    <ReportHistoryTable
      columns={EMPLOYMENT_COLUMNS}
      rows={rows}
      footnote={EMPLOYMENT_FOOTNOTE}
    />
  );
};
