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

import { mapValues } from "lodash";

import { ParoleBoardReportMode } from "../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import {
  PersonalHistoryFields,
  ResolvedPersonalHistory,
  SubstanceUseFields,
} from "../../../../ParoleStore/report/personalHistory";
import { ResolvedRow } from "../../../../ParoleStore/report/resolveSection";
import {
  ParoleSectionCard,
  ParoleSectionTitle,
  ParoleSubsection,
  ParoleSubsectionTitle,
} from "../ParoleCaseProfileStyles";
import { formatReportMonth } from "./report/reportMonth";
import { ReportMonthInput } from "./report/ReportMonthInput";
import { ReportRowColumn } from "./report/reportRowColumn";
import { ReportRowList } from "./report/ReportRowList";
import { ReportRowValues } from "./report/reportRowValues";
import { ReportSelectInput } from "./report/ReportSelectInput";
import { ReportTextBox, ReportTextBoxes } from "./report/ReportTextBoxes";
import { ReportTextInput } from "./report/ReportTextInput";
import { Removal } from "./report/useRemoveWithUndo";

type Field = keyof PersonalHistoryFields;

// The data sheet's labels and character limits, in the order the design shows
// the boxes.
export const PERSONAL_HISTORY_BOXES: ReadonlyArray<ReportTextBox<Field>> = [
  {
    field: "socialHistory",
    label: "Social History/Early Life",
    maxLength: 2500,
  },
  { field: "relationships", label: "Relationships/Children", maxLength: 1500 },
  { field: "education", label: "Education Background", maxLength: 1000 },
  { field: "occupation", label: "Occupational Background", maxLength: 1000 },
  { field: "military", label: "Military Background", maxLength: 500 },
];

// Ends the section, after the substance use rows.
export const RESIDENT_COMMENTS_BOX: ReportTextBox<Field> = {
  field: "residentComments",
  label: "Resident's Comments",
  maxLength: 1500,
};

// The data sheet's limit for the Substance and Heaviest Use columns.
export const SUBSTANCE_USE_TEXT_MAX_LENGTH = 100;

// Ages 1 to 100, as the Missouri SAR Builder offers for its drug history.
const AGE_OPTIONS = Array.from({ length: 100 }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));

// The Substance Use History table's columns, in the order the design shows
// them.
export const SUBSTANCE_USE_COLUMNS: ReadonlyArray<
  ReportRowColumn<SubstanceUseFields>
> = [
  {
    header: "Substance",
    fields: ["substance"],
    display: ({ substance }) => substance,
    input: ({ values, onChange, label, disabled }) => (
      <ReportTextInput
        value={values.substance}
        onChange={(substance) => onChange({ substance })}
        label={label}
        maxLength={SUBSTANCE_USE_TEXT_MAX_LENGTH}
        rows={1}
        disabled={disabled}
      />
    ),
  },
  {
    header: "Age of First Use",
    fields: ["ageOfFirstUse"],
    width: "11rem",
    display: ({ ageOfFirstUse }) =>
      ageOfFirstUse === null ? null : String(ageOfFirstUse),
    input: ({ values, onChange, label, disabled }) => (
      <ReportSelectInput
        value={values.ageOfFirstUse}
        onChange={(ageOfFirstUse) => onChange({ ageOfFirstUse })}
        options={AGE_OPTIONS}
        label={label}
        disabled={disabled}
      />
    ),
  },
  {
    header: "Last Use",
    fields: ["lastUse"],
    width: "11rem",
    display: ({ lastUse }) => lastUse && formatReportMonth(lastUse),
    input: ({ values, onChange, label, disabled }) => (
      <ReportMonthInput
        value={values.lastUse}
        onChange={(lastUse) => onChange({ lastUse })}
        label={label}
        disabled={disabled}
      />
    ),
  },
  {
    header: "Heaviest Use",
    fields: ["heaviestUse"],
    display: ({ heaviestUse }) => heaviestUse,
    input: ({ values, onChange, label, disabled }) => (
      <ReportTextInput
        value={values.heaviestUse}
        onChange={(heaviestUse) => onChange({ heaviestUse })}
        label={label}
        maxLength={SUBSTANCE_USE_TEXT_MAX_LENGTH}
        rows={1}
        disabled={disabled}
      />
    ),
  },
];

/**
 * US_ID's Personal History card: the PHI's notes on the resident's background,
 * in one box each for their early life, relationships and children,
 * education, occupation, and military service. A table below them lists the
 * resident's substance use, one row per substance, and a last box holds the
 * resident's comments. Each box saves as the PHI types. The PHI adds a
 * substance in a new row in the table and saves it with the row's Save
 * button.
 *
 * @param mode - EDIT or READ. The report presenter picks it.
 * @param history - The resolved Personal History section.
 * @param onSave - Saves one box's text, or null when the PHI emptied it.
 * @param onSaveSubstance - Saves a substance row's changed values. A new
 *   row's first save creates it. A null value clears the field.
 * @param onRemoveSubstance - Starts removing a substance row and returns the
 *   write and its undo, as ParoleBoardReportPresenter.removeRow does.
 */
export function UsIdPersonalHistorySection({
  mode,
  history,
  onSave,
  onSaveSubstance,
  onRemoveSubstance,
}: {
  mode: ParoleBoardReportMode;
  history: ResolvedPersonalHistory;
  onSave: (field: Field, value: string | null) => Promise<void>;
  onSaveSubstance: (
    rowId: string,
    changes: Partial<ReportRowValues<SubstanceUseFields>>,
  ) => Promise<void>;
  onRemoveSubstance: (row: ResolvedRow<SubstanceUseFields>) => Removal;
}) {
  const values = mapValues(history.fields, (field) => field.value);

  return (
    <ParoleSectionCard>
      <ParoleSectionTitle>Personal History</ParoleSectionTitle>
      <ReportTextBoxes
        mode={mode}
        boxes={PERSONAL_HISTORY_BOXES}
        values={values}
        onSave={onSave}
      />
      <ParoleSubsection>
        <ParoleSubsectionTitle>Substance Use History</ParoleSubsectionTitle>
        <ReportRowList
          mode={mode}
          rows={history.rows}
          columns={SUBSTANCE_USE_COLUMNS}
          itemName="Substance"
          emptyState="No substance use entered"
          onSave={onSaveSubstance}
          onRemove={onRemoveSubstance}
          addIn="INLINE"
        />
      </ParoleSubsection>
      <ReportTextBoxes
        mode={mode}
        boxes={[RESIDENT_COMMENTS_BOX]}
        values={values}
        onSave={onSave}
      />
    </ParoleSectionCard>
  );
}
