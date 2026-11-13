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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { ParoleBoardReportMode } from "../../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { ReportLongTextField } from "./ReportLongTextField";

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

/** One box in a stack of report text boxes. */
export type ReportTextBox<Field extends string> = {
  // The section field the box saves to.
  field: Field;
  label: string;
  // The data sheet's character limit for the box.
  maxLength: number;
};

/**
 * A stack of labeled report boxes that save as the PHI types, one for each
 * free-text field in a section, such as the Community Reentry Plan's Housing
 * and Employment boxes.
 *
 * @param mode - EDIT or READ. The report presenter picks it.
 * @param boxes - The boxes, in the order to show them.
 * @param values - Each box's saved text, or null when it's empty.
 * @param onSave - Saves one box's text, or null when the PHI emptied it.
 */
export function ReportTextBoxes<Field extends string>({
  mode,
  boxes,
  values,
  onSave,
}: {
  mode: ParoleBoardReportMode;
  boxes: ReadonlyArray<ReportTextBox<Field>>;
  values: Record<Field, string | null>;
  onSave: (field: Field, value: string | null) => Promise<void>;
}) {
  return (
    <Stack>
      {boxes.map((box) => (
        <ReportLongTextField
          key={box.field}
          mode={mode}
          label={box.label}
          value={values[box.field]}
          onSave={(value) => onSave(box.field, value)}
          maxLength={box.maxLength}
        />
      ))}
    </Stack>
  );
}
