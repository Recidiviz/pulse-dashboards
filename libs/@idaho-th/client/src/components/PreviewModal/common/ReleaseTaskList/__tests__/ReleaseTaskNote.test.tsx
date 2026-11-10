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

import { act, fireEvent, render, screen } from "@testing-library/react";

import { RELEASE_TASK_NOTE_MAX_LENGTH } from "~@idaho-th/shared";

import { ReleaseTaskNote } from "../ReleaseTaskNote";

const NOTE_DEBOUNCE_MS = 900;

const getInput = () => screen.getByLabelText("Transportation note");

const typeNote = (note: string) =>
  fireEvent.change(getInput(), { target: { value: note } });

const runDebounce = () =>
  act(() => {
    vi.advanceTimersByTime(NOTE_DEBOUNCE_MS);
  });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ReleaseTaskNote", () => {
  it("saves once after the case manager stops typing", () => {
    const onChange = vi.fn();
    render(
      <ReleaseTaskNote
        value=""
        editable
        onChange={onChange}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    typeNote("Bu");
    typeNote("Bus");
    expect(onChange).not.toHaveBeenCalled();

    runDebounce();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("Bus");
  });

  it("saves the pending edit immediately on blur", () => {
    const onChange = vi.fn();
    render(
      <ReleaseTaskNote
        value=""
        editable
        onChange={onChange}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    typeNote("Family pickup");
    fireEvent.blur(getInput());

    expect(onChange).toHaveBeenCalledExactlyOnceWith("Family pickup");

    runDebounce();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("saves the pending edit when the modal closes mid-typing", () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <ReleaseTaskNote
        value=""
        editable
        onChange={onChange}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    typeNote("Bus");
    unmount();

    expect(onChange).toHaveBeenCalledExactlyOnceWith("Bus");
  });

  it("keeps the typed value when a refetch returns the older note", () => {
    const { rerender } = render(
      <ReleaseTaskNote
        value=""
        editable
        onChange={vi.fn()}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    typeNote("Bus pass");
    rerender(
      <ReleaseTaskNote
        value="Bus"
        editable
        onChange={vi.fn()}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    expect(getInput()).toHaveValue("Bus pass");
  });

  it("adopts the saved note until the case manager edits it", () => {
    const { rerender } = render(
      <ReleaseTaskNote
        value=""
        editable
        onChange={vi.fn()}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    rerender(
      <ReleaseTaskNote
        value="Bus"
        editable
        onChange={vi.fn()}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    expect(getInput()).toHaveValue("Bus");
  });

  it("caps the note at the length the server accepts", () => {
    render(
      <ReleaseTaskNote
        value=""
        editable
        onChange={vi.fn()}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    expect(getInput()).toHaveAttribute(
      "maxlength",
      String(RELEASE_TASK_NOTE_MAX_LENGTH),
    );
  });

  it("shows providers the saved note as read-only text", () => {
    render(
      <ReleaseTaskNote
        value="Bus"
        editable={false}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    expect(screen.getByText("Bus")).toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        "How will the client get to the provider? E.g., bus, family pickup",
      ),
    ).not.toBeInTheDocument();
  });

  it("tells providers when no note has been added", () => {
    render(
      <ReleaseTaskNote
        value=""
        editable={false}
        ariaLabel="Transportation note"
        placeholder="How will the client get to the provider? E.g., bus, family pickup"
        emptyMessage="The Case Manager has not provided transportation details yet."
      />,
    );

    expect(
      screen.getByText(
        "The Case Manager has not provided transportation details yet.",
      ),
    ).toBeInTheDocument();
  });
});
