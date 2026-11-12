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

import { spacing, typography } from "@recidiviz/design-system";
import { hideVisually, rem } from "polished";
import { Ref, useId, useImperativeHandle } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

import { ParoleBoardReportMode } from "../../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { AUTOSAVE_FAILED_MESSAGE, MISSING_VALUE_TEXT } from "./constants";
import { ReportTextInput } from "./ReportTextInput";
import { useAutosavedText } from "./useAutosavedText";

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  width: 100%;
`;

const Label = styled.label<{ $hidden?: boolean }>`
  ${typography.Sans16}
  color: ${palette.slate70};
  ${({ $hidden }) => $hidden && hideVisually()}
`;

const ReadText = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  /* Keeps the PHI's line breaks. */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const ErrorText = styled.div`
  ${typography.Sans12}
  display: flex;
  gap: ${rem(spacing.xs)};
  color: ${palette.signal.error};
`;

const RetryButton = styled.button.attrs({ type: "button" })`
  ${typography.Sans12}
  padding: 0;
  border: none;
  background: none;
  color: ${palette.signal.links};
  text-decoration: underline;
  cursor: pointer;
`;

export type ReportLongTextFieldHandle = {
  // Saves any text the PHI hasn't saved yet, and rejects if the save fails.
  // A section awaits it before removing the row the field belongs to, and
  // stops the removal if it rejects, so a late save can't recreate the row.
  flush: () => Promise<void>;
};

/**
 * A labeled, multi-line report field that saves as the PHI types, such as an
 * offense's Description or a section's Resident's Comments. See
 * useAutosavedText for when it saves and what it shows while the PHI types.
 * If a save fails, it keeps the PHI's text and shows an error with a button to
 * try again.
 *
 * In read mode, for the review page and commissioners, it shows the saved
 * text in full, keeping the PHI's line breaks.
 *
 * @param mode - EDIT or READ. The report presenter picks it.
 * @param label - The field's visible label, such as "Description".
 * @param value - The field's saved value, or null when it's empty.
 * @param onSave - Saves the text, or null when the PHI emptied the box.
 * @param maxLength - The most characters the field takes.
 * @param placeholder - Shows in the empty box, such as "Enter description".
 * @param rows - How many lines the box shows before the PHI resizes it.
 * @param hideLabel - Whether to hide the label from view, for a field whose
 *   section title already names it. Screen readers still read the label.
 * @param ref - Receives a handle whose flush saves any unsaved text now.
 */
export function ReportLongTextField({
  mode,
  label,
  value,
  onSave,
  maxLength,
  placeholder,
  rows = 4,
  hideLabel = false,
  ref,
}: {
  mode: ParoleBoardReportMode;
  label: string;
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  maxLength: number;
  placeholder?: string;
  rows?: number;
  hideLabel?: boolean;
  ref?: Ref<ReportLongTextFieldHandle>;
}) {
  const inputId = useId();
  const { text, onChange, onFocus, onBlur, flush, saveFailed } =
    useAutosavedText({ value, onSave });
  useImperativeHandle(ref, () => ({ flush }), [flush]);

  if (mode === "READ") {
    return (
      <Field>
        <Label as="div" $hidden={hideLabel}>
          {label}
        </Label>
        <ReadText>{value || MISSING_VALUE_TEXT}</ReadText>
      </Field>
    );
  }

  return (
    <Field>
      <Label htmlFor={inputId} $hidden={hideLabel}>
        {label}
      </Label>
      <ReportTextInput
        id={inputId}
        label={label}
        value={text}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={rows}
      />
      {saveFailed && (
        <ErrorText role="alert">
          {AUTOSAVE_FAILED_MESSAGE}
          <RetryButton onClick={() => flush().catch(() => undefined)}>
            Try again
          </RetryButton>
        </ErrorText>
      )}
    </Field>
  );
}
