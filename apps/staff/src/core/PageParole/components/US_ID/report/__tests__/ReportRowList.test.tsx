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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReactModal from "react-modal";

import { ParoleBoardReportMode } from "../../../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { PastActionFields } from "../../../../../../ParoleStore/report/pastActions";
import { ResolvedRow } from "../../../../../../ParoleStore/report/resolveSection";
import {
  pastActionColumns,
  pastActionRows,
  SENTENCED_ID,
  UNDATED_ID,
} from "../__fixtures__/pastActions";
import { MISSING_VALUE_TEXT } from "../constants";
import { ReportRowColumn } from "../reportRowColumn";
import { ReportRowList } from "../ReportRowList";
import { SAVE_FAILED_MESSAGE } from "../ReportRowModal";
import { ReportRowValues, resolveSavedNewRow } from "../reportRowValues";
import { Removal } from "../useRemoveWithUndo";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { dismiss: vi.fn(), error: vi.fn() }),
}));

vi.mock("../../../../../../hooks/useIsMobile", () => ({
  default: () => ({ isMobile: false }),
}));

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

function renderList({
  mode = "EDIT",
  rows = pastActionRows,
  columns = pastActionColumns,
  addIn,
}: {
  mode?: ParoleBoardReportMode;
  rows?: ReadonlyArray<ResolvedRow<PastActionFields>>;
  columns?: ReadonlyArray<ReportRowColumn<PastActionFields>>;
  addIn?: "MODAL" | "INLINE";
} = {}) {
  const onSave =
    vi.fn<
      (
        rowId: string,
        changes: Partial<ReportRowValues<PastActionFields>>,
      ) => Promise<void>
    >();
  onSave.mockResolvedValue(undefined);
  const onRemove = vi.fn<(row: ResolvedRow<PastActionFields>) => Removal>();
  onRemove.mockImplementation(() => ({
    done: Promise.resolve(),
    undo: vi.fn().mockResolvedValue(undefined),
  }));

  const list = (listRows: ReadonlyArray<ResolvedRow<PastActionFields>>) => (
    <ReportRowList
      mode={mode}
      rows={listRows}
      columns={columns}
      itemName="Past Action"
      emptyState="No past actions"
      onSave={onSave}
      onRemove={onRemove}
      addIn={addIn}
    />
  );
  const { rerender } = render(list(rows));
  // Stands in for the report listener sending the section's rows again.
  const sendRows = (next: ReadonlyArray<ResolvedRow<PastActionFields>>) =>
    rerender(list(next));
  return { onSave, onRemove, sendRows };
}

// Returns the rows with one row's date changed, as another tab's edit would
// arrive from the report listener.
const withDate = (
  rows: ReadonlyArray<ResolvedRow<PastActionFields>>,
  id: string,
  date: string,
) =>
  rows.map((row) =>
    row.id === id
      ? {
          ...row,
          fields: { ...row.fields, date: { ...row.fields.date, value: date } },
        }
      : row,
  );

// The list's Add button. While the Add modal is open, it has an Add button
// too, so tests reach that one through the dialog.
const addButton = () => screen.getAllByRole("button", { name: "Add" })[0];
const saveButton = () => screen.getByRole("button", { name: "Save" });
const addDialog = () => screen.getByRole("dialog", { name: "Add Past Action" });

describe("ReportRowList", () => {
  describe("passing columns the resolved row", () => {
    // Shows where a row's note came from, as a section that marks the PHI's
    // edits to Atlas values would.
    const sourceColumn: ReportRowColumn<PastActionFields> = {
      header: "Source",
      fields: [],
      display: (_values, row) => `${row.status} ${row.fields.notes.source}`,
      input: () => null,
    };

    it("passes each row's resolved row to the column", () => {
      renderList({ mode: "READ", columns: [sourceColumn] });

      expect(screen.getAllByText("ADDED_BY_PHI PHI")).toHaveLength(3);
    });

    it("passes a row it just saved as resolveSection would resolve it", async () => {
      const user = userEvent.setup();
      renderList({ rows: [], columns: [...pastActionColumns, sourceColumn] });

      await user.click(addButton());
      const dialog = addDialog();
      await user.type(
        within(dialog).getByRole("textbox", { name: "Notes" }),
        "Paroled",
      );
      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      expect(await screen.findByText("ADDED_BY_PHI PHI")).toBeInTheDocument();
    });
  });

  describe("in read mode", () => {
    it("shows each row's values as plain text, with no buttons", () => {
      renderList({ mode: "READ" });

      const rows = screen.getAllByRole("row").slice(1);
      expect(rows.map((row) => row.textContent)).toEqual([
        "Mar 2015Sentenced, entered custody",
        "Jun 2019Paroled to a community work center",
        `${MISSING_VALUE_TEXT}Completed a cognitive skills program`,
      ]);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    it("shows the empty state, with no Add button, when there are no rows", () => {
      renderList({ mode: "READ", rows: [] });

      expect(screen.getByText("No past actions")).toBeInTheDocument();
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });
  });

  describe("adding a row in the modal", () => {
    it("opens an Add modal whose Add button stays disabled until the row has a value", async () => {
      const user = userEvent.setup();
      renderList();

      await user.click(addButton());

      const dialog = addDialog();
      const add = within(dialog).getByRole("button", { name: "Add" });
      const notes = within(dialog).getByRole("textbox", { name: "Notes" });
      expect(notes).toHaveValue("");
      expect(add).toBeDisabled();
      await user.type(notes, "   ");
      expect(add).toBeDisabled();
      await user.type(notes, "Paroled");
      expect(add).toBeEnabled();
    });

    it("saves the new row under a new PHI row id, closes, and keeps showing the row", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList();

      await user.click(addButton());
      const dialog = addDialog();
      await user.type(
        within(dialog).getByRole("textbox", { name: "Notes" }),
        "  Moved to a new facility ",
      );
      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      expect(onSave).toHaveBeenCalledWith(
        expect.stringMatching(/^phi_\d{13}_[0-9a-f]{8}$/),
        { notes: "Moved to a new facility" },
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      // The report listener hasn't sent the row back, since rows is
      // unchanged, but the saved row still shows.
      expect(screen.getByText("Moved to a new facility")).toBeInTheDocument();
    });

    it("doesn't leave a copy of a new row behind when the listener sends the row before its save finishes", async () => {
      const user = userEvent.setup();
      const { onSave, sendRows } = renderList();
      let finishSave: () => void = () => undefined;
      onSave.mockReturnValue(
        new Promise((resolve) => {
          finishSave = () => resolve(undefined);
        }),
      );

      await user.click(addButton());
      const dialog = addDialog();
      await user.type(
        within(dialog).getByRole("textbox", { name: "Notes" }),
        "Paroled",
      );
      await user.click(within(dialog).getByRole("button", { name: "Add" }));
      // Firestore sends the new row from its local copy before the save
      // finishes.
      const [newRowId] = onSave.mock.calls[0];
      sendRows([
        ...pastActionRows,
        resolveSavedNewRow<PastActionFields>(
          newRowId,
          { date: null, notes: null },
          { notes: "Paroled" },
        ),
      ]);
      await act(async () => finishSave());
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      // Removing the row drops it from the listener's rows.
      sendRows(pastActionRows);

      expect(screen.queryByText("Paroled")).not.toBeInTheDocument();
    });

    it("closes on Cancel without saving", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList();

      await user.click(addButton());
      const dialog = addDialog();
      await user.type(
        within(dialog).getByRole("textbox", { name: "Notes" }),
        "Draft",
      );
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(onSave).not.toHaveBeenCalled();
    });

    it("stays open, with an error, when the save fails", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList();
      onSave.mockRejectedValue(new Error("offline"));

      await user.click(addButton());
      const dialog = addDialog();
      await user.type(
        within(dialog).getByRole("textbox", { name: "Notes" }),
        "Paroled",
      );
      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        SAVE_FAILED_MESSAGE,
      );
      expect(addDialog()).toBeInTheDocument();
    });
  });

  describe("adding a row inline", () => {
    it("opens a new row whose Save stays disabled until it has a value", async () => {
      const user = userEvent.setup();
      renderList({ addIn: "INLINE" });

      await user.click(addButton());

      expect(saveButton()).toBeDisabled();
      expect(addButton()).toBeDisabled();
      await user.type(screen.getByRole("textbox", { name: "Notes" }), "   ");
      expect(saveButton()).toBeDisabled();
      await user.type(
        screen.getByRole("textbox", { name: "Notes" }),
        "Paroled",
      );
      expect(saveButton()).toBeEnabled();
    });

    it("saves the new row's values under a new PHI row id, and keeps showing it", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList({ addIn: "INLINE" });

      await user.click(addButton());
      await user.type(
        screen.getByRole("textbox", { name: "Notes" }),
        "  Moved to a new facility ",
      );
      await user.click(saveButton());

      expect(onSave).toHaveBeenCalledWith(
        expect.stringMatching(/^phi_\d{13}_[0-9a-f]{8}$/),
        { notes: "Moved to a new facility" },
      );
      // The report listener hasn't sent the row back, since rows is
      // unchanged, but the saved row still shows.
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByText("Moved to a new facility")).toBeInTheDocument();
      expect(addButton()).toBeEnabled();
    });

    it("discards the new row on Cancel without saving", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList({ addIn: "INLINE" });

      await user.click(addButton());
      await user.type(screen.getByRole("textbox", { name: "Notes" }), "Draft");
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it("keeps the new row open, with an error, when the save fails", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList({ addIn: "INLINE" });
      onSave.mockRejectedValue(new Error("offline"));

      await user.click(addButton());
      await user.type(
        screen.getByRole("textbox", { name: "Notes" }),
        "Paroled",
      );
      await user.click(saveButton());

      expect(screen.getByRole("alert")).toHaveTextContent(SAVE_FAILED_MESSAGE);
      expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue(
        "Paroled",
      );
    });

    it("shows a row once while its save is in flight, though the listener already sent it", async () => {
      const user = userEvent.setup();
      const { onSave, sendRows } = renderList({ addIn: "INLINE" });
      let finishSave: () => void = () => undefined;
      onSave.mockReturnValue(
        new Promise((resolve) => {
          finishSave = () => resolve(undefined);
        }),
      );

      await user.click(addButton());
      await user.type(
        screen.getByRole("textbox", { name: "Notes" }),
        "Paroled",
      );
      await user.click(saveButton());
      // Firestore sends the new row from its local copy before the save
      // finishes.
      const [newRowId] = onSave.mock.calls[0];
      sendRows([
        ...pastActionRows,
        resolveSavedNewRow<PastActionFields>(
          newRowId,
          { date: null, notes: null },
          { notes: "Paroled" },
        ),
      ]);

      // Only saved rows have an Edit button, so the listener's copy of the
      // new row would add a fourth.
      const editButtons = () =>
        screen.getAllByRole("button", { name: "Edit Past Action" });
      expect(editButtons()).toHaveLength(pastActionRows.length);
      expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue(
        "Paroled",
      );

      await act(async () => finishSave());

      expect(editButtons()).toHaveLength(pastActionRows.length + 1);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("keeps every change when a column's input changes two fields at once", async () => {
      const user = userEvent.setup();
      const fillBoth: ReportRowColumn<PastActionFields> = {
        header: "Both",
        fields: ["date", "notes"],
        display: () => null,
        input: ({ onChange }) => (
          <button
            type="button"
            onClick={() => {
              onChange({ date: "2020-01" });
              onChange({ notes: "Released to parole" });
            }}
          >
            Fill both
          </button>
        ),
      };
      const { onSave } = renderList({ addIn: "INLINE", columns: [fillBoth] });

      await user.click(addButton());
      await user.click(screen.getByRole("button", { name: "Fill both" }));
      await user.click(saveButton());

      expect(onSave).toHaveBeenCalledWith(expect.any(String), {
        date: "2020-01",
        notes: "Released to parole",
      });
    });

    it("replaces the empty state with the new row", async () => {
      const user = userEvent.setup();
      renderList({ rows: [], addIn: "INLINE" });

      expect(screen.getByText("No past actions")).toBeInTheDocument();
      await user.click(addButton());

      expect(screen.queryByText("No past actions")).not.toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: "Notes" }),
      ).toBeInTheDocument();
    });
  });

  describe("editing a row", () => {
    const openEditModal = async (
      user: ReturnType<typeof userEvent.setup>,
      index: number,
    ) => {
      await user.click(
        screen.getAllByRole("button", { name: "Edit Past Action" })[index],
      );
      return screen.getByRole("dialog");
    };

    it("opens the row in a modal and saves only the fields the PHI changed", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList();

      const dialog = await openEditModal(user, 0);
      const notes = within(dialog).getByRole("textbox", { name: "Notes" });
      expect(notes).toHaveValue("Sentenced, entered custody");
      expect(
        within(dialog).getByRole("button", { name: "Save" }),
      ).toBeDisabled();

      await user.clear(notes);
      await user.type(notes, "Sentenced");
      await user.click(within(dialog).getByRole("button", { name: "Save" }));

      expect(onSave).toHaveBeenCalledWith(SENTENCED_ID, { notes: "Sentenced" });
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    });

    it("saves null for a field the PHI cleared", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList();

      const dialog = await openEditModal(user, 0);
      await user.click(
        within(dialog).getByRole("button", { name: "Clear Date" }),
      );
      await user.click(within(dialog).getByRole("button", { name: "Save" }));

      expect(onSave).toHaveBeenCalledWith(SENTENCED_ID, { date: null });
    });

    it("keeps the PHI's entries out of FullStory, since the modal renders outside the page", async () => {
      const user = userEvent.setup();
      renderList();

      const dialog = await openEditModal(user, 0);

      expect(
        within(dialog)
          .getByRole("textbox", { name: "Notes" })
          .closest(".fs-exclude"),
      ).not.toBeNull();
    });

    it("doesn't write back a field another tab changed while the modal was open", async () => {
      const user = userEvent.setup();
      const { onSave, sendRows } = renderList();

      const dialog = await openEditModal(user, 0);
      sendRows(withDate(pastActionRows, SENTENCED_ID, "2016-01"));

      expect(
        within(dialog).getByRole("button", { name: "Save" }),
      ).toBeDisabled();

      await user.type(
        within(dialog).getByRole("textbox", { name: "Notes" }),
        " again",
      );
      await user.click(within(dialog).getByRole("button", { name: "Save" }));

      expect(onSave).toHaveBeenCalledWith(SENTENCED_ID, {
        notes: "Sentenced, entered custody again",
      });
    });

    it("has no Remove button", async () => {
      const user = userEvent.setup();
      renderList();

      const dialog = await openEditModal(user, 0);

      expect(
        within(dialog).queryByRole("button", { name: /remove/i }),
      ).not.toBeInTheDocument();
    });

    it("doesn't save an edit that would clear every field", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList();

      // The undated row has only notes.
      const dialog = await openEditModal(user, 2);
      await user.clear(within(dialog).getByRole("textbox", { name: "Notes" }));

      expect(
        within(dialog).getByRole("button", { name: "Save" }),
      ).toBeDisabled();
      expect(onSave).not.toHaveBeenCalledWith(UNDATED_ID, expect.anything());
    });

    it("stays open with an error when the save fails", async () => {
      const user = userEvent.setup();
      const { onSave } = renderList();
      onSave.mockRejectedValue(new Error("offline"));

      const dialog = await openEditModal(user, 0);
      await user.type(
        within(dialog).getByRole("textbox", { name: "Notes" }),
        " again",
      );
      await user.click(within(dialog).getByRole("button", { name: "Save" }));

      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        SAVE_FAILED_MESSAGE,
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("removing a row", () => {
    it("removes the row right away, and it leaves once the listener drops it", async () => {
      const { onRemove, sendRows } = renderList();

      fireEvent.click(
        screen.getAllByRole("button", { name: "Remove Past Action" })[0],
      );

      expect(onRemove).toHaveBeenCalledWith(
        expect.objectContaining({ id: SENTENCED_ID, status: "ADDED_BY_PHI" }),
      );
      await act(async () =>
        sendRows(pastActionRows.filter((row) => row.id !== SENTENCED_ID)),
      );
      expect(
        screen.queryByText("Sentenced, entered custody"),
      ).not.toBeInTheDocument();
    });
  });
});
