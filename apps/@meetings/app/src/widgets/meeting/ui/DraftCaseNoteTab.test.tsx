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

import Clipboard from "@react-native-clipboard/clipboard";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";

import DraftCaseNoteTab from "./DraftCaseNoteTab";

// Capture the onSuccess callback the component hands to useUpdateNotes so we can
// simulate a successful save without wiring up a real tRPC mutation.
let mockCapturedOnSuccess: (() => void) | undefined;
const mockMutate = jest.fn();
jest.mock("~@meetings/app/entities/meeting", () => ({
  useUpdateNotes: jest.fn((options?: { onSuccess?: () => void }) => {
    mockCapturedOnSuccess = options?.onSuccess;
    return { mutate: mockMutate };
  }),
}));

const mockShowSnackbar = jest.fn();
jest.mock("~@meetings/app/shared/ui/Snackbar", () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar, isShowing: false }),
}));

const mockTrack = jest.fn();
jest.mock("~@meetings/app/shared/analytics", () => ({
  useAnalytics: () => ({ track: mockTrack }),
}));

const mockInvalidate = jest.fn();
jest.mock("~@meetings/app/shared/api", () => ({
  trpc: {
    useUtils: () => ({
      v1: { meeting: { getDetails: { invalidate: mockInvalidate } } },
    }),
  },
}));

// The jest.fn() is created inside the factory (not captured from an outer
// `const`) because this factory runs while the component module is imported —
// before any outer variable is initialized. We read the handle back off the
// mocked default export below.
jest.mock("@react-native-clipboard/clipboard", () => ({
  __esModule: true,
  default: { setString: jest.fn() },
}));
const mockSetString = Clipboard.setString as jest.Mock;

const DEBOUNCE_MS = 5000;
const MEETING_ID = "meeting-1";
const PERSON_ID = "person-1";
const ORIGINAL_NOTE = "Original case note";

function renderTab(caseNote = ORIGINAL_NOTE, canEdit = true) {
  const utils = render(
    <DraftCaseNoteTab
      meetingId={MEETING_ID}
      caseNote={caseNote}
      personId={PERSON_ID}
      canEdit={canEdit}
    />,
  );
  const input = utils.getByDisplayValue(caseNote);
  return { ...utils, input };
}

const EDIT_HINT = "Place your cursor where you want to start typing";

describe("DraftCaseNoteTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCapturedOnSuccess = undefined;
  });

  it("does not call the save mutation immediately while typing", () => {
    const { input } = renderTab();

    fireEvent.changeText(input, "Updated note text");

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("fires the mutation with the latest text after the debounce elapses", () => {
    const { input } = renderTab();

    fireEvent.changeText(input, "First edit");
    fireEvent.changeText(input, "Second edit");

    // Still within the debounce window: nothing saved yet.
    act(() => {
      jest.advanceTimersByTime(DEBOUNCE_MS - 1);
    });
    expect(mockMutate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith({
      meetingId: MEETING_ID,
      caseNote: "Second edit",
    });
  });

  it("flushes the pending save on unmount instead of dropping it", () => {
    const { input, unmount } = renderTab();

    fireEvent.changeText(input, "Edit before leaving");

    // Unmount before the debounce fires; the cleanup effect should flush it.
    expect(mockMutate).not.toHaveBeenCalled();
    unmount();

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith({
      meetingId: MEETING_ID,
      caseNote: "Edit before leaving",
    });
  });

  it("copies the original note content, not the in-progress edit", () => {
    const { input, getByText } = renderTab();

    fireEvent.changeText(input, "Unsaved in-progress edit");
    fireEvent.press(getByText("Copy"));

    expect(mockSetString).toHaveBeenCalledWith(ORIGINAL_NOTE);
    expect(mockSetString).not.toHaveBeenCalledWith("Unsaved in-progress edit");
    expect(mockTrack).toHaveBeenCalledWith("case_notes_copied", {
      meetingId: MEETING_ID,
      personId: PERSON_ID,
    });
  });

  describe("when the user cannot edit (not the meeting creator)", () => {
    it("renders the case note read-only and hides the edit hint", () => {
      const { input, queryByText } = renderTab(ORIGINAL_NOTE, false);

      expect(queryByText(EDIT_HINT)).toBeNull();
      expect(input.props.readOnly).toBe(true);
    });

    it("does not save when the text changes", () => {
      const { input, getByDisplayValue } = renderTab(ORIGINAL_NOTE, false);

      fireEvent.changeText(input, "Tampered text");
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockMutate).not.toHaveBeenCalled();
      // The change is also rejected locally (value unchanged).
      expect(getByDisplayValue(ORIGINAL_NOTE)).toBeTruthy();
    });

    it("defaults to read-only when canEdit is omitted (deny-by-default)", () => {
      const { getByDisplayValue, queryByText } = render(
        <DraftCaseNoteTab
          meetingId={MEETING_ID}
          caseNote={ORIGINAL_NOTE}
          personId={PERSON_ID}
        />,
      );

      expect(queryByText(EDIT_HINT)).toBeNull();
      expect(getByDisplayValue(ORIGINAL_NOTE).props.readOnly).toBe(true);
    });
  });

  describe("when the user can edit (the meeting creator)", () => {
    it("shows the edit hint and renders the note editable", () => {
      const { input, getByText } = renderTab();

      expect(getByText(EDIT_HINT)).toBeTruthy();
      expect(input.props.readOnly).toBe(false);
    });
  });

  describe("snackbar feedback", () => {
    it("shows a snackbar and invalidates the meeting on a successful save", () => {
      renderTab();

      act(() => {
        mockCapturedOnSuccess?.();
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ meetingId: MEETING_ID });
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        "Case note changes saved",
        6000,
      );
    });

    it("shows a snackbar when the note is copied", () => {
      const { getByText } = renderTab();

      fireEvent.press(getByText("Copy"));

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        "Case note copied to clipboard",
      );
    });
  });
});
