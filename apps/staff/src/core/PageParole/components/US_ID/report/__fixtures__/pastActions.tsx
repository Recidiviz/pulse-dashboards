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

import { PastActionsInput } from "~datatypes";

import {
  PastActionFields,
  resolvePastActions,
} from "../../../../../../ParoleStore/report/pastActions";
import { formatReportMonth } from "../reportMonth";
import { ReportMonthInput } from "../ReportMonthInput";
import { ReportRowColumn } from "../reportRowColumn";
import { ReportTextInput } from "../ReportTextInput";

// Past Actions columns and rows for the row list's examples and tests. The
// Past Actions section defines its own columns.

export const PAST_ACTION_NOTES_LIMIT = 250;

export const pastActionColumns: ReadonlyArray<
  ReportRowColumn<PastActionFields>
> = [
  {
    header: "Date",
    fields: ["date"],
    width: "10rem",
    secondary: true,
    display: ({ date }) => date && formatReportMonth(date),
    input: ({ values, onChange, label, disabled }) => (
      <ReportMonthInput
        value={values.date}
        onChange={(date) => onChange({ date })}
        label={label}
        disabled={disabled}
      />
    ),
  },
  {
    header: "Notes",
    fields: ["notes"],
    display: ({ notes }) => notes,
    input: ({ values, onChange, label, disabled }) => (
      <ReportTextInput
        value={values.notes}
        onChange={(notes) => onChange({ notes })}
        label={label}
        maxLength={PAST_ACTION_NOTES_LIMIT}
        disabled={disabled}
      />
    ),
  },
];

const EDITED_AT = new Date("2026-11-02T15:00:00Z");

const phiEdit = (value: string) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: EDITED_AT,
});

export const SENTENCED_ID = "phi_1793800000000_a1b2c3d4";
export const PAROLED_ID = "phi_1793800060000_e5f6a7b8";
export const UNDATED_ID = "phi_1793800120000_c9d0e1f2";

const pastActionsInput: PastActionsInput = {
  rows: {
    [UNDATED_ID]: {
      source: "PHI",
      fields: { notes: phiEdit("Completed a cognitive skills program") },
    },
    [PAROLED_ID]: {
      source: "PHI",
      fields: {
        date: phiEdit("2019-06"),
        notes: phiEdit("Paroled to a community work center"),
      },
    },
    [SENTENCED_ID]: {
      source: "PHI",
      fields: {
        date: phiEdit("2015-03"),
        notes: phiEdit("Sentenced, entered custody"),
      },
    },
  },
};

/** Three rows: two dated, oldest first, then one with no date. */
export const pastActionRows = resolvePastActions(pastActionsInput).rows;
