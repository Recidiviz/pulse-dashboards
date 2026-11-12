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
import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { Button, Icon, palette } from "~design-system";

import { ParoleBoardReportMode } from "../../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { newPhiRowId } from "../../../../../ParoleStore/report/newPhiRowId";
import { ResolvedRow } from "../../../../../ParoleStore/report/resolveSection";
import { EmptyState } from "../../shared";
import { ReportRowColumn } from "./reportRowColumn";
import { ReportRowModal, SAVE_FAILED_MESSAGE } from "./ReportRowModal";
import {
  blankRowValues,
  newRowChanges,
  ReportRowValues,
  resolveSavedNewRow,
  rowValues,
} from "./reportRowValues";
import { Removal, useRemoveWithUndo } from "./useRemoveWithUndo";

// What a cell shows for a field with no value. Q16 in the design doc decides
// how a missing value reads, so change it here.
export const MISSING_VALUE_TEXT = "----";

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(spacing.md)};
`;

const Table = styled.table`
  ${typography.Sans14}
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: left;
`;

const HeaderCell = styled.th`
  color: ${palette.slate70};
  font-weight: 400;
  padding: 0 ${rem(spacing.lg)} ${rem(spacing.sm)} 0;
  border-bottom: 1px solid ${palette.slate10};
`;

const Cell = styled.td<{ $secondary?: boolean }>`
  color: ${({ $secondary }) => ($secondary ? palette.slate70 : palette.pine1)};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)} ${rem(spacing.md)} 0;
  border-bottom: 1px solid ${palette.slate10};
  vertical-align: top;
  /* Keeps the PHI's line breaks. */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

// Holds a saved row's edit and remove buttons.
const ActionsColumn = styled.col`
  width: ${rem(72)};
`;

const ActionsCell = styled(Cell)`
  /* Takes off the icon buttons' own padding, so the icons line up with the
     first line of text. */
  padding-top: ${rem(spacing.md - spacing.xs)};
  padding-right: 0;
  text-align: right;
  white-space: nowrap;
`;

// A new row's inputs sit above its Save and Cancel buttons, which take the
// full width of the table rather than widening the actions column.
const NewRowInputCell = styled(Cell)`
  border-bottom: none;
  padding-bottom: ${rem(spacing.sm)};
`;

const NewRowButtonsCell = styled(ActionsCell)`
  padding-top: 0;
`;

// The design-system pill is roomier than the design draws the list's buttons.
const CompactButton = styled(Button)`
  && {
    min-width: 0;
    min-height: ${rem(32)};
    padding: ${rem(6)} ${rem(spacing.md)};
  }
`;

const AddButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

// The design's Add button has a thin plus, which the design-system icons
// don't include.
function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M6 1v10M1 6h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const Actions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

const IconButton = styled.button.attrs({ type: "button" })`
  display: inline-flex;
  padding: ${rem(spacing.xs)};
  border: none;
  border-radius: ${rem(4)};
  background: transparent;
  color: ${palette.pine4};
  cursor: pointer;

  &:hover {
    color: ${palette.pine2};
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
  }
`;

const ErrorText = styled.div`
  ${typography.Sans12}
  margin-top: ${rem(spacing.xs)};
  color: ${palette.signal.error};
  white-space: normal;
`;

type NewRow<Fields> = {
  id: string;
  values: ReportRowValues<Fields>;
  saving: boolean;
  failed: boolean;
};

/**
 * A list of report rows that the PHI adds, edits, and removes, such as Past
 * Actions. Its columns come from the section, and it takes rows and
 * callbacks as props rather than reading the report.
 *
 * In edit mode:
 * - Add opens a modal with an input for each column, such as "Add Past
 *   Action". With addIn INLINE, as for Substance Use, it opens a new row in
 *   the table instead, with Save and Cancel buttons. Either way the row
 *   exists only in the list until it's saved, so nothing writes an empty
 *   row, and saving stays disabled until the row has a value.
 * - Each saved row has an edit button, which opens it in a modal, and a
 *   remove button. Remove calls onRemove right away and shows an undo toast
 *   whose Undo button calls the undo onRemove returned. The row leaves the
 *   list once the report listener drops it.
 *
 * In read mode, for the review page and commissioners, it shows the same
 * rows as plain text with no buttons.
 *
 * @param mode - EDIT or READ. The report presenter picks it.
 * @param rows - The section's resolved rows, in the order to show them.
 * @param columns - What each column shows and how the PHI edits it.
 * @param itemName - Names one row in labels and messages, such as "Past
 *   Action" in "Edit Past Action".
 * @param emptyState - Shows in place of the table when there are no rows.
 * @param onSave - Saves a row's changed values. A new row's first save
 *   creates it, under a new PHI row id. A null value clears the field.
 * @param onRemove - Starts removing the row and returns the write and its
 *   undo, as ParoleBoardReportPresenter.removeRow does.
 * @param addLabel - The Add button's text.
 * @param addIn - Where Add opens the new row: MODAL, the default, or INLINE
 *   in the table.
 */
export function ReportRowList<Fields>({
  mode,
  rows,
  columns,
  itemName,
  emptyState,
  onSave,
  onRemove,
  addLabel = "Add",
  addIn = "MODAL",
}: {
  mode: ParoleBoardReportMode;
  rows: ReadonlyArray<ResolvedRow<Fields>>;
  columns: ReadonlyArray<ReportRowColumn<Fields>>;
  itemName: string;
  emptyState: ReactNode;
  onSave: (
    rowId: string,
    changes: Partial<ReportRowValues<Fields>>,
  ) => Promise<void>;
  onRemove: (row: ResolvedRow<Fields>) => Removal;
  addLabel?: string;
  addIn?: "MODAL" | "INLINE";
}) {
  const editable = mode === "EDIT";
  const [newRow, setNewRow] = useState<NewRow<Fields>>();
  // The id of the row the Add modal is adding, while it's open.
  const [addingRowId, setAddingRowId] = useState<string>();
  // Rows saved from a new row that the report listener hasn't sent back yet.
  // The list keeps showing them so they don't flash away in between.
  const [savedNewRows, setSavedNewRows] = useState<
    ReadonlyArray<ResolvedRow<Fields>>
  >([]);
  const [editingRowId, setEditingRowId] = useState<string>();
  const newRowRef = useRef<HTMLTableRowElement>(null);

  const { remove } = useRemoveWithUndo({
    removedMessage: `${itemName} removed`,
    failedMessage: `${itemName} wasn't removed. Try again.`,
    undoFailedMessage: `${itemName} wasn't restored.`,
  });

  const rowIds = new Set(rows.map((row) => row.id));
  // While an inline row saves, the report listener already sends the row
  // from Firestore's local copy, so the list leaves that copy out until the
  // save finishes rather than showing the row twice.
  const savingNewRowId = newRow?.saving ? newRow.id : undefined;
  const visibleRows = rows.filter((row) => row.id !== savingNewRowId);
  const unsentSavedRows = savedNewRows.filter((row) => !rowIds.has(row.id));
  const editingRow = visibleRows.find((row) => row.id === editingRowId);

  // Drops a saved new row once the listener sends it back. Keeping it would
  // bring the row back if it were later removed. It also runs when a copy is
  // added, because the listener usually sends the row from Firestore's local
  // copy before the save finishes, so the copy can arrive after the row.
  // Returning the same array when nothing arrived skips the re-render.
  useEffect(() => {
    const arrivedIds = new Set(rows.map((row) => row.id));
    setSavedNewRows((current) =>
      current.some((row) => arrivedIds.has(row.id))
        ? current.filter((row) => !arrivedIds.has(row.id))
        : current,
    );
  }, [rows, savedNewRows]);

  // Moves focus into a new row when Add opens it.
  const newRowId = newRow?.id;
  useEffect(() => {
    if (!newRowId) return;
    newRowRef.current
      ?.querySelector<HTMLElement>("button, input, textarea, select")
      ?.focus();
  }, [newRowId]);

  const blankValues = blankRowValues(
    columns.flatMap((column) => column.fields),
  );

  const addRow = () => {
    if (addIn === "MODAL") {
      setAddingRowId(newPhiRowId());
      return;
    }
    setNewRow({
      id: newPhiRowId(),
      values: blankValues,
      saving: false,
      failed: false,
    });
  };

  // Saves a new row, then keeps showing it until the listener sends it back.
  const saveAddedRow = async (
    rowId: string,
    changes: Partial<ReportRowValues<Fields>>,
  ) => {
    await onSave(rowId, changes);
    setSavedNewRows((current) => [
      ...current,
      resolveSavedNewRow(rowId, blankValues, changes),
    ]);
  };

  const saveNewRow = async (row: NewRow<Fields>) => {
    const changes = newRowChanges(row.values);
    if (Object.keys(changes).length === 0) return;
    setNewRow({ ...row, saving: true, failed: false });
    try {
      await saveAddedRow(row.id, changes);
      setNewRow(undefined);
    } catch {
      setNewRow({ ...row, saving: false, failed: true });
    }
  };

  const cells = (row: ResolvedRow<Fields>) => {
    const values = rowValues(row);
    return columns.map((column) => (
      <Cell key={column.header} $secondary={column.secondary}>
        {column.display(values, row) ?? MISSING_VALUE_TEXT}
      </Cell>
    ));
  };

  const isEmpty =
    visibleRows.length === 0 && unsentSavedRows.length === 0 && !newRow;

  return (
    <ListWrapper>
      {isEmpty ? (
        <EmptyState>{emptyState}</EmptyState>
      ) : (
        <Table>
          <colgroup>
            {columns.map((column) => (
              <col key={column.header} style={{ width: column.width }} />
            ))}
            {editable && <ActionsColumn />}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => (
                <HeaderCell key={column.header} scope="col">
                  {column.header}
                </HeaderCell>
              ))}
              {editable && <HeaderCell scope="col" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                {cells(row)}
                {editable && (
                  <ActionsCell>
                    <Actions>
                      <IconButton
                        aria-label={`Edit ${itemName}`}
                        onClick={() => setEditingRowId(row.id)}
                      >
                        <Icon kind="Edit" size={12} color="currentColor" />
                      </IconButton>
                      <IconButton
                        aria-label={`Remove ${itemName}`}
                        onClick={() => remove(row.id, () => onRemove(row))}
                      >
                        {/* The Minus glyph is half as wide as its box, so it
                            needs a taller box to match the edit icon's width. */}
                        <Icon
                          kind="Minus"
                          width={9}
                          height={18}
                          color="currentColor"
                        />
                      </IconButton>
                    </Actions>
                  </ActionsCell>
                )}
              </tr>
            ))}
            {unsentSavedRows.map((row) => (
              <tr key={row.id}>
                {cells(row)}
                {editable && <ActionsCell />}
              </tr>
            ))}
            {editable && newRow && (
              <Fragment key={newRow.id}>
                <tr ref={newRowRef}>
                  {columns.map((column) => (
                    <NewRowInputCell key={column.header}>
                      {column.input({
                        values: newRow.values,
                        onChange: (changes) =>
                          setNewRow(
                            (current) =>
                              current && {
                                ...current,
                                values: { ...current.values, ...changes },
                              },
                          ),
                        label: column.header,
                        disabled: newRow.saving,
                      })}
                    </NewRowInputCell>
                  ))}
                  <NewRowInputCell />
                </tr>
                <tr>
                  <NewRowButtonsCell colSpan={columns.length + 1}>
                    <Actions>
                      <CompactButton
                        kind="borderless"
                        onClick={() => setNewRow(undefined)}
                        disabled={newRow.saving}
                      >
                        Cancel
                      </CompactButton>
                      <CompactButton
                        onClick={() => saveNewRow(newRow)}
                        disabled={
                          newRow.saving ||
                          Object.keys(newRowChanges(newRow.values)).length === 0
                        }
                      >
                        Save
                      </CompactButton>
                    </Actions>
                    {newRow.failed && (
                      <ErrorText role="alert">{SAVE_FAILED_MESSAGE}</ErrorText>
                    )}
                  </NewRowButtonsCell>
                </tr>
              </Fragment>
            )}
          </tbody>
        </Table>
      )}
      {editable && (
        <CompactButton kind="secondary" onClick={addRow} disabled={!!newRow}>
          <AddButtonContent>
            <PlusIcon />
            {addLabel}
          </AddButtonContent>
        </CompactButton>
      )}
      {editable && editingRow && (
        <ReportRowModal
          key={editingRow.id}
          title={`Edit ${itemName}`}
          columns={columns}
          savedValues={rowValues(editingRow)}
          onSave={(changes) => onSave(editingRow.id, changes)}
          onClose={() => setEditingRowId(undefined)}
        />
      )}
      {editable && addingRowId && (
        <ReportRowModal
          key={addingRowId}
          title={`Add ${itemName}`}
          columns={columns}
          savedValues={blankValues}
          isNew
          onSave={(changes) => saveAddedRow(addingRowId, changes)}
          onClose={() => setAddingRowId(undefined)}
        />
      )}
    </ListWrapper>
  );
}
