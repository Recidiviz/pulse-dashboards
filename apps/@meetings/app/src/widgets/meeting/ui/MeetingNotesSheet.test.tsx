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

import { fireEvent, render, screen } from "@testing-library/react-native";

import type { MeetingDetails } from "~@meetings/app/entities/meeting";

import MeetingNotesSheet from "./MeetingNotesSheet";

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

jest.mock("../lib/copyMeetingNotes", () => ({
  copyMeetingNotes: jest.fn(),
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

const meetingDetails = {
  id: "m1",
  meetingType: null,
  meetingTypeCategory: null,
  startTime: new Date("2026-01-01T10:00:00Z"),
  endTime: null,
  durationMs: null,
  caseNote: "Case note",
  userNotepadNotes: "notes",
  actionItems: ["Action one"],
  meetingActionItems: [],
  structuredActionItems: [],
  staffFeedback: null,
  currentOutputVotes: null,
  caseNoteEditedAt: null,
  actionItemsEditedAt: null,
  approvals: { caseNote: false, actionItems: false },
  postMeetingProcessingStatus: "NOT_STARTED",
  validationErrorType: null,
  transcriptDeletedAt: null,
  transcription: null,
  staffEmail: "creator@example.com",
  audioUrl: null,
} satisfies MeetingDetails;

function renderSheet(canEdit?: boolean) {
  render(
    <MeetingNotesSheet
      meetingDetails={meetingDetails}
      clientName="Test Person"
      bottomSheetRef={{ current: null }}
      personId="person-1"
      canEdit={canEdit}
    />,
  );
}

describe("MeetingNotesSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when the user cannot edit (not the meeting creator)", () => {
    it("makes the inputs read-only and hides the save button", () => {
      renderSheet(false);

      expect(screen.getByDisplayValue("Action one").props.readOnly).toBe(true);
      expect(screen.queryByText("SAVE CHANGES")).toBeNull();
      expect(screen.getByText("CLOSE")).toBeTruthy();
    });

    it("is read-only by default when canEdit is omitted (deny-by-default)", () => {
      renderSheet();

      expect(screen.getByDisplayValue("Action one").props.readOnly).toBe(true);
      expect(screen.queryByText("SAVE CHANGES")).toBeNull();
      expect(screen.getByText("CLOSE")).toBeTruthy();
    });
  });

  describe("when the user can edit (the meeting creator)", () => {
    it("makes the inputs editable and saves the edited values on Save", () => {
      renderSheet(true);

      expect(screen.getByDisplayValue("Action one").props.readOnly).toBe(false);
      expect(screen.getByText("CANCEL")).toBeTruthy();

      // Edit before saving, so we verify the edit actually propagates.
      fireEvent.changeText(screen.getByDisplayValue("Action one"), "Edited AI");
      fireEvent.press(screen.getByText("SAVE CHANGES"));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          meetingId: "m1",
          actionItems: ["Edited AI"],
        }),
      );
    });
  });
});
