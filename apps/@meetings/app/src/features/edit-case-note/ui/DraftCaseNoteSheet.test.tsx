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

import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { createRef } from "react";

import { DraftCaseNoteSheet } from "./DraftCaseNoteSheet";

const mockMutate = jest.fn();
jest.mock("~@meetings/app/entities/meeting", () => ({
  formatDraftCaseNoteMeetingDate: () => "Jan 1, 2026",
  useUpdateNotes: () => ({ mutate: mockMutate }),
}));

jest.mock("~@meetings/app/shared/analytics", () => ({
  useAnalytics: () => ({ track: jest.fn() }),
}));

jest.mock("~@meetings/app/shared/ui/Snackbar", () => ({
  useSnackbar: () => ({ showSnackbar: jest.fn(), isShowing: false }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@react-native-clipboard/clipboard", () => ({
  __esModule: true,
  default: { setString: jest.fn() },
}));

jest.mock("@gorhom/bottom-sheet", () =>
  require("~@meetings/app/tests/mocks/bottomSheet").bottomSheetMock(),
);

jest.mock("react-native-heroicons/outline/ChevronLeftIcon", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("react-native-heroicons/outline/DocumentDuplicateIcon", () => ({
  __esModule: true,
  default: () => null,
}));

const NOTES = "Draft case note text";

function renderSheet(canEdit?: boolean) {
  render(
    <DraftCaseNoteSheet
      meetingId="m1"
      notes={NOTES}
      clientName="Test Person"
      meetingDate={new Date("2026-01-01T10:00:00Z")}
      ref={createRef<BottomSheetModal>()}
      personId="person-1"
      canEdit={canEdit}
    />,
  );
}

describe("DraftCaseNoteSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when the user cannot edit (not the meeting creator)", () => {
    it("makes the note read-only and shows only a Close button", () => {
      renderSheet(false);

      expect(screen.getByDisplayValue(NOTES).props.readOnly).toBe(true);
      expect(screen.getByText("Close")).toBeTruthy();
      expect(screen.queryByText("Save changes")).toBeNull();
    });

    it("is read-only by default when canEdit is omitted (deny-by-default)", () => {
      renderSheet();

      expect(screen.getByDisplayValue(NOTES).props.readOnly).toBe(true);
      expect(screen.getByText("Close")).toBeTruthy();
      expect(screen.queryByText("Save changes")).toBeNull();
    });
  });

  describe("when the user can edit (the meeting creator)", () => {
    it("makes the note editable and saves the edited value on Save changes", () => {
      renderSheet(true);

      expect(screen.getByDisplayValue(NOTES).props.readOnly).toBe(false);
      expect(screen.getByText("Cancel")).toBeTruthy();

      // Edit before saving, so we verify the edit actually propagates.
      fireEvent.changeText(screen.getByDisplayValue(NOTES), "Edited note");
      fireEvent.press(screen.getByText("Save changes"));

      expect(mockMutate).toHaveBeenCalledWith({
        meetingId: "m1",
        caseNote: "Edited note",
      });
    });
  });
});
