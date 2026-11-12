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
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import ReactModal from "react-modal";

import type { CalendarWeekday } from "~@parole-board/common";
import { calendarApiError } from "~@parole-board/common/fixtures";

import { isAllowedDay } from "../../model/isAllowedDay";
import {
  MOVE_FAILED_MESSAGE,
  MoveEntryModal,
  type MoveEntryModalProps,
} from "../MoveEntryModal";

const MONDAY_TO_FRIDAY: CalendarWeekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

function renderModal(props: Partial<MoveEntryModalProps> = {}) {
  const onCancel = vi.fn();
  const onMove = vi.fn((_date: string) => Promise.resolve());
  const view = render(
    <MoveEntryModal
      isOpen
      month={{ year: 2026, month: 9 }}
      labels={["CCF"]}
      currentDate="2026-09-15"
      isDisabled={(date) => !isAllowedDay(date, MONDAY_TO_FRIDAY)}
      alreadyOn={{ "2026-09-16": ["CCF"] }}
      onCancel={onCancel}
      onMove={onMove}
      {...props}
    />,
  );
  return { ...view, onCancel, onMove };
}

const dialog = () => screen.getByRole("dialog");
const day = (name: string | RegExp) => screen.getByRole("radio", { name });
const moveButton = () => screen.getByRole("button", { name: /^Move to/ });
const cancelButton = () => screen.getByRole("button", { name: "Cancel" });

// react-modal reads keyCode, which user-event doesn't set.
const pressEscape = () =>
  fireEvent.keyDown(document.activeElement ?? dialog(), {
    key: "Escape",
    code: "Escape",
    keyCode: 27,
  });

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("MoveEntryModal", () => {
  it("shows the month, the heading, the day picker and the buttons", () => {
    renderModal();

    expect(dialog()).toHaveAccessibleName("Move CCF");
    expect(screen.getByText("September 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Move CCF" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Day" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(30);
    expect(cancelButton()).toBeEnabled();
    expect(moveButton()).toHaveTextContent("Move to September 15");
  });

  it("starts on the current day, marks it and disables the move until another day is chosen", async () => {
    const { onMove } = renderModal();

    const current = day("September 15 (current day)");
    expect(current).toBeChecked();
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(moveButton()).toBeDisabled();

    await userEvent.click(day("September 21"));

    expect(moveButton()).toHaveTextContent("Move to September 21");
    expect(moveButton()).toBeEnabled();
    expect(screen.getByText("Now")).toBeInTheDocument();

    await userEvent.click(moveButton());
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledExactlyOnceWith("2026-09-21"),
    );
  });

  it("disables weekends and days that already have the label, saying why", () => {
    renderModal();

    expect(day("September 16 (already has CCF)")).toBeDisabled();
    expect(day("September 19")).toBeDisabled();
    expect(day("September 20")).toBeDisabled();
    expect(day("September 17")).toBeEnabled();
    expect(day("September 21")).toBeEnabled();
  });

  it("never disables the current day, even if alreadyOn lists it", () => {
    renderModal({ alreadyOn: { "2026-09-15": ["CCF"] } });

    expect(day(/^September 15/)).toBeEnabled();
    expect(day(/^September 15/)).toBeChecked();
  });

  it("moves several hearings on different days, with no day chosen at first", async () => {
    const { onMove } = renderModal({
      labels: ["FCF", "CCF", "AVCF"],
      currentDate: null,
      alreadyOn: { "2026-09-16": ["CCF"], "2026-09-22": ["FCF", "AVCF"] },
    });

    expect(dialog()).toHaveAccessibleName("Move 3 hearings");
    expect(
      screen.getByRole("heading", { name: "Move 3 hearings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("FCF, CCF and AVCF")).toBeInTheDocument();
    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
    expect(screen.queryByText("Now")).toBeNull();
    expect(moveButton()).toHaveTextContent("Move to…");
    expect(moveButton()).toBeDisabled();
    expect(day("September 22 (already has FCF and AVCF)")).toBeDisabled();

    await userEvent.click(day("September 15"));
    await userEvent.click(moveButton());

    await waitFor(() =>
      expect(onMove).toHaveBeenCalledExactlyOnceWith("2026-09-15"),
    );
  });

  it("lists two hearings with 'and' alone", () => {
    renderModal({ labels: ["CCF", "SCF"] });

    expect(
      screen.getByRole("heading", { name: "Move 2 hearings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("CCF and SCF")).toBeInTheDocument();
  });

  it("calls onCancel from Cancel and from Escape", async () => {
    const { onCancel } = renderModal();

    await userEvent.click(cancelButton());
    expect(onCancel).toHaveBeenCalledTimes(1);

    pressEscape();
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("focuses the chosen day on open, then moves with the keyboard alone", async () => {
    const { onMove } = renderModal();

    await waitFor(() =>
      expect(day("September 15 (current day)")).toHaveFocus(),
    );

    // The 16th already has CCF, so the arrow key skips to the 17th.
    await userEvent.keyboard("{ArrowRight}");
    expect(day("September 17")).toHaveFocus();
    expect(day("September 17")).toBeChecked();

    await userEvent.tab();
    await userEvent.tab();
    expect(moveButton()).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await waitFor(() =>
      expect(onMove).toHaveBeenCalledExactlyOnceWith("2026-09-17"),
    );
  });

  it("focuses the first open day on open when no day is chosen", async () => {
    renderModal({ labels: ["FCF", "CCF"], currentDate: null });

    await waitFor(() => expect(day("September 1")).toHaveFocus());
  });

  it("waits while the move runs: every control is disabled and Escape does nothing", async () => {
    const { onCancel } = renderModal({
      onMove: () => new Promise(() => undefined),
    });
    await userEvent.click(day("September 21"));

    await userEvent.click(moveButton());

    await waitFor(() =>
      expect(moveButton()).toHaveAttribute("aria-busy", "true"),
    );
    expect(moveButton()).toBeDisabled();
    expect(moveButton()).toHaveTextContent("Move to September 21");
    expect(cancelButton()).toBeDisabled();
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
    expect(screen.getByRole("status")).toHaveTextContent(
      "Moving to September 21…",
    );
    expect(dialog()).toHaveFocus();

    pressEscape();
    // The overlay is react-modal's backdrop, which has no role to query by.
    const overlay = document.querySelector(".ReactModal__Overlay");
    if (overlay) fireEvent.click(overlay);
    expect(overlay).not.toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("moves with Enter on a day", async () => {
    const { onMove } = renderModal();
    await userEvent.click(day("September 21"));

    fireEvent.keyDown(day("September 21"), { key: "Enter" });

    await waitFor(() =>
      expect(onMove).toHaveBeenCalledExactlyOnceWith("2026-09-21"),
    );
  });

  it("disables every other day when two moving hearings share a name", () => {
    renderModal({
      labels: ["CCF", "CCF"],
      currentDate: null,
      alreadyOn: {},
    });

    expect(day("September 21 (would have CCF twice)")).toBeDisabled();
    expect(
      screen
        .getAllByRole("radio")
        .filter((radio) => !(radio as HTMLInputElement).disabled),
    ).toHaveLength(0);
    expect(moveButton()).toBeDisabled();
  });

  it("shows a failed move, keeps the chosen day and returns focus to the move button", async () => {
    renderModal({
      onMove: () => Promise.reject(new Error("Network error")),
    });
    await userEvent.click(day("September 21"));

    await userEvent.click(moveButton());

    expect(await within(dialog()).findByRole("alert")).toHaveTextContent(
      MOVE_FAILED_MESSAGE,
    );
    expect(day("September 21")).toBeChecked();
    expect(moveButton()).toBeEnabled();
    await waitFor(() => expect(moveButton()).toHaveFocus());
  });

  it("shows the server's message when it was written for editors", async () => {
    renderModal({
      onMove: () =>
        Promise.reject(calendarApiError("BAD_REQUEST", "Pick a weekday.")),
    });
    await userEvent.click(day("September 21"));

    await userEvent.click(moveButton());

    expect(await within(dialog()).findByRole("alert")).toHaveTextContent(
      "Pick a weekday.",
    );
  });

  it("renders nothing while closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each([
    ["one hearing", {}],
    ["several hearings", { labels: ["FCF", "CCF"], currentDate: null }],
  ])("has no axe violations with %s", async (_, props) => {
    renderModal(props);

    expect(await axe(dialog())).toHaveNoViolations();
  });

  it("has no axe violations with an error", async () => {
    renderModal({ onMove: () => Promise.reject(new Error("Network error")) });
    await userEvent.click(day("September 21"));
    await userEvent.click(moveButton());
    await within(dialog()).findByRole("alert");

    expect(await axe(dialog())).toHaveNoViolations();
  });
});
