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
import React from "react";

import { useUserContext } from "~@meetings/app/entities/user";
import type { Person } from "~@meetings/app/shared/api";

import MeetingCardItem from "./MeetingCardItem";

jest.mock("~@meetings/app/entities/user", () => ({
  useUserContext: jest.fn(),
}));

// Spy that records the props DraftCaseNoteSheet is rendered with, so we can
// assert the canEdit wiring (canEditNote && isMeetingCreator).
const mockDraftSheetSpy = jest.fn();
jest.mock("~@meetings/app/features/edit-case-note", () => ({
  DraftCaseNoteSheet: (props: { canEdit: boolean }) => {
    mockDraftSheetSpy(props);
    return null;
  },
}));

jest.mock("~@meetings/app/entities/meeting", () => ({
  isMeetingProcessing: () => false,
}));
jest.mock("~@meetings/app/entities/meeting-type", () => ({
  MeetingTypeTag: () => null,
}));
jest.mock("~@meetings/app/shared/analytics", () => ({
  useAnalytics: () => ({ track: jest.fn() }),
}));
jest.mock("~@meetings/app/shared/ui/ProcessingErrorBanner", () => () => null);
jest.mock("~@meetings/app/shared/ui/Snackbar", () => ({
  useSnackbar: () => ({ showSnackbar: jest.fn(), isShowing: false }),
}));
jest.mock("~@meetings/app/shared/api", () => ({}));
jest.mock("../lib/useProcessingText", () => ({
  useProcessingText: () => ({ title: "", subtitle: "" }),
}));
jest.mock("@gorhom/bottom-sheet", () => ({ BottomSheetModal: () => null }));
jest.mock("@react-navigation/native", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@react-native-clipboard/clipboard", () => ({
  __esModule: true,
  default: { setString: jest.fn() },
}));
jest.mock("react-native-heroicons/outline", () => ({
  ChevronDownIcon: () => null,
  ChevronRightIcon: () => null,
}));
jest.mock("react-native-heroicons/solid", () => ({
  DocumentDuplicateIcon: () => null,
  PencilIcon: () => null,
}));

const CREATOR_EMAIL = "creator@recidiviz.org";

function makeMeeting(
  staffEmail: string,
): React.ComponentProps<typeof MeetingCardItem>["meeting"] {
  return {
    id: "m1",
    meetingType: null,
    meetingTypeCategory: null,
    date: "Monday Jan 01",
    time: "10:00",
    duration: null,
    content: "A case note",
    status: "COMPLETED",
    validationErrorType: null,
    start: new Date("2026-01-01T10:00:00Z"),
    end: new Date("2026-01-01T11:00:00Z"),
    caseNote: "A case note",
    staffEmail,
  };
}

const person: Person = {
  personId: BigInt(1),
  givenNames: "Test",
  surname: "Person",
  fullName: "Test Person",
  displayPersonExternalId: "EXT-1",
  supervisionType: "PROBATION",
  staffEmails: [],
  activeMeetingId: null,
  meetingDetails: {
    id: null,
    lastCompletedMeetingTime: null,
    caseNote: null,
    validationErrorType: null,
    staffEmail: null,
  },
  primaryMetadata: "test",
  lastMeeting: "Jan 1, 2026",
  caseNoteInsightsSummaries: [],
};

function renderCard(staffEmail: string) {
  render(
    <MeetingCardItem
      meeting={makeMeeting(staffEmail)}
      person={person}
      personType="client"
    />,
  );
}

describe("MeetingCardItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows Edit for the creator and wires canEdit=true into the sheet on Edit", () => {
    (useUserContext as jest.Mock).mockReturnValue({ email: CREATOR_EMAIL });

    renderCard(CREATOR_EMAIL);

    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByText("Show more")).toBeTruthy();
    // Before pressing Edit, the sheet is read-only (canEditNote is false).
    expect(mockDraftSheetSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ canEdit: false }),
    );

    fireEvent.press(screen.getByText("Edit"));

    // After Edit, canEditNote && isMeetingCreator => true.
    expect(mockDraftSheetSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ canEdit: true }),
    );
  });

  it("hides Edit for a non-creator and keeps the sheet read-only", () => {
    (useUserContext as jest.Mock).mockReturnValue({
      email: "someone-else@recidiviz.org",
    });

    renderCard(CREATOR_EMAIL);

    expect(screen.queryByText("Edit")).toBeNull();
    expect(screen.getByText("Show more")).toBeTruthy();
    expect(screen.getByText("Copy")).toBeTruthy();
    // The sheet is never given canEdit=true for a non-creator.
    for (const call of mockDraftSheetSpy.mock.calls) {
      expect(call[0].canEdit).toBe(false);
    }
  });

  it("hides Edit for an unsynced offline meeting (empty staffEmail)", () => {
    (useUserContext as jest.Mock).mockReturnValue({ email: CREATOR_EMAIL });

    renderCard("");

    expect(screen.queryByText("Edit")).toBeNull();
  });
});
