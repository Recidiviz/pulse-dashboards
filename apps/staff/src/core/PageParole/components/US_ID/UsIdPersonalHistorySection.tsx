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
} from "../../../../ParoleStore/report/personalHistory";
import {
  ParoleSectionCard,
  ParoleSectionTitle,
} from "../ParoleCaseProfileStyles";
import { ReportTextBox, ReportTextBoxes } from "./report/ReportTextBoxes";

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

/**
 * US_ID's Personal History card: the PHI's notes on the resident's background,
 * in one box each for their early life, relationships and children,
 * education, occupation, and military service, then a box for the resident's
 * comments. Each box saves as the PHI types.
 *
 * @param mode - EDIT or READ. The report presenter picks it.
 * @param history - The resolved Personal History section.
 * @param onSave - Saves one box's text, or null when the PHI emptied it.
 */
export function UsIdPersonalHistorySection({
  mode,
  history,
  onSave,
}: {
  mode: ParoleBoardReportMode;
  history: ResolvedPersonalHistory;
  onSave: (field: Field, value: string | null) => Promise<void>;
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
      <ReportTextBoxes
        mode={mode}
        boxes={[RESIDENT_COMMENTS_BOX]}
        values={values}
        onSave={onSave}
      />
    </ParoleSectionCard>
  );
}
