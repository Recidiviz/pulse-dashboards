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
import { rem } from "polished";
import { FormEvent, useId, useState } from "react";
import styled from "styled-components";

import { Button, Icon, palette } from "~design-system";

import { DialogModal } from "../../../../DialogModal";
import { ReportRowColumn } from "./reportRowColumn";
import {
  editedRowChanges,
  keepsAValue,
  newRowChanges,
  ReportRowValues,
} from "./reportRowValues";

const MODAL_GUTTER = rem(40);

const StyledDialogModal = styled(DialogModal)`
  .ReactModal__Content {
    width: ${rem(600)};
    max-width: 90vw;
    padding: 0;
    /* The design's sharper corners, which the Paperwork modals also use. */
    border-radius: ${rem(4)};
    /* Lets the date picker open past the modal's edge rather than being
       clipped by it. The modal is short enough that it never needs to
       scroll. */
    overflow: visible;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: ${MODAL_GUTTER} ${MODAL_GUTTER} 0;
`;

const ModalTitle = styled.h2`
  ${typography.Sans24}
  color: ${palette.pine1};
  margin: 0;
`;

const CloseButton = styled.button.attrs({ type: "button" })`
  display: flex;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${palette.slate60};
  cursor: pointer;
`;

// The modal renders under document.body, outside the case profile's FullStory
// exclusion, so it excludes the PHI's entries itself.
const ModalBody = styled.div.attrs({ className: "fs-exclude" })`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding: ${rem(spacing.xl)} ${MODAL_GUTTER} ${MODAL_GUTTER};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

const FieldLabel = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
`;

const ErrorText = styled.div`
  ${typography.Sans14}
  color: ${palette.signal.error};
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.sm)} ${MODAL_GUTTER};
  border-top: 1px solid ${palette.slate10};
`;

const CancelButton = styled(Button).attrs({ kind: "borderless" })`
  && {
    color: ${palette.slate70};
  }
`;

const SaveButton = styled(Button).attrs({ shape: "block" })`
  && {
    min-width: ${rem(108)};
    min-height: ${rem(44)};
    padding: 0 ${rem(spacing.lg)};
  }
`;

export const SAVE_FAILED_MESSAGE = "Couldn't save. Try again.";

/**
 * A modal that edits one report row, with an input for each column and a
 * Save button. The row list opens it to edit a saved row, and with isNew,
 * to add a row from its Add button, with an Add button in place of Save.
 *
 * The modal saves only the fields the PHI changed, and doesn't save a row
 * with no values. It closes once the save succeeds, and stays open with an
 * error if the save fails.
 *
 * @param title - Heading of the modal, such as "Edit Past Action".
 * @param columns - The list's columns, whose inputs the modal shows in
 *   order, each under its header.
 * @param savedValues - The row's saved values, or empty values for a new
 *   row.
 * @param isNew - Whether the modal adds a row rather than editing one.
 * @param onSave - Saves the changed fields. A null value clears the field.
 * @param onClose - Closes the modal.
 */
export function ReportRowModal<Fields>({
  title,
  columns,
  savedValues,
  isNew = false,
  onSave,
  onClose,
}: {
  title: string;
  columns: ReadonlyArray<ReportRowColumn<Fields>>;
  savedValues: ReportRowValues<Fields>;
  isNew?: boolean;
  onSave: (changes: Partial<ReportRowValues<Fields>>) => Promise<void>;
  onClose: () => void;
}) {
  const titleId = useId();
  // The row's values when the modal opened. Changes are measured against
  // these rather than the live savedValues, so an edit another tab makes to
  // the row while the modal is open doesn't count as the PHI's change, and
  // Save doesn't write the old value back over it.
  const [openedValues] = useState(savedValues);
  const [values, setValues] = useState(savedValues);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const changes = isNew
    ? newRowChanges(values)
    : editedRowChanges(openedValues, values);
  // Checks the live row, since that's the row the save changes.
  const canSave =
    Object.keys(changes).length > 0 && keepsAValue(savedValues, changes);

  // Closing mid-save would hide a failed save from the PHI.
  const close = () => {
    if (!saving) onClose();
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      await onSave(changes);
      onClose();
    } catch {
      setSaving(false);
      setFailed(true);
    }
  };

  return (
    <StyledDialogModal
      isOpen
      onRequestClose={close}
      aria={{ labelledby: titleId }}
    >
      <ModalHeader>
        <ModalTitle id={titleId}>{title}</ModalTitle>
        <CloseButton onClick={close} aria-label="Close" disabled={saving}>
          <Icon kind="Close" size={16} />
        </CloseButton>
      </ModalHeader>
      <form onSubmit={save}>
        <ModalBody>
          {columns.map((column) => (
            <Field key={column.header}>
              <FieldLabel aria-hidden>{column.header}</FieldLabel>
              {column.input({
                values,
                onChange: (update) =>
                  setValues((current) => ({ ...current, ...update })),
                label: column.header,
                disabled: saving,
              })}
            </Field>
          ))}
          {failed && <ErrorText role="alert">{SAVE_FAILED_MESSAGE}</ErrorText>}
        </ModalBody>
        <ModalFooter>
          <CancelButton onClick={close} disabled={saving}>
            Cancel
          </CancelButton>
          <SaveButton type="submit" disabled={!canSave || saving}>
            {isNew ? "Add" : "Save"}
          </SaveButton>
        </ModalFooter>
      </form>
    </StyledDialogModal>
  );
}
