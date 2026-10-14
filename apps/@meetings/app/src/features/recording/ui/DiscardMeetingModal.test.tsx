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

import * as Sentry from "@sentry/react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { useDiscardMeeting } from "~@meetings/app/entities/meeting";

import { useActiveMeetingStore } from "../model/activeMeetingStore";
import { useAudioRecording } from "../model/RecordingProvider";
import { DiscardMeetingModal } from "./DiscardMeetingModal";

jest.mock("@sentry/react-native", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  captureException: jest.fn(),
}));

jest.mock("../model/RecordingProvider", () => ({
  useAudioRecording: jest.fn(),
}));

jest.mock("~@meetings/app/shared/ui/Snackbar", () => ({
  useSnackbar: () => ({ showSnackbar: jest.fn() }),
}));

jest.mock("../../../shared/ui/Modal", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const mockPerson = {
  personId: "person-1",
  fullName: "John Doe",
  primaryMetadata: "",
  lastMeeting: "",
  supervisionType: "PROBATION",
} as never;

const MEETING_ID = "meeting-1";

jest.mock("~@meetings/app/entities/meeting", () => ({
  useDiscardMeeting: jest.fn(),
}));

const mockDiscardRecording = jest.fn();
const mockResumeRecording = jest.fn();
const mockDiscardMeeting = jest.fn();
const mockCleanup = jest.fn();

async function pressDiscard() {
  render(<DiscardMeetingModal />);
  // The Discard button stays disabled for a three-second countdown.
  act(() => jest.advanceTimersByTime(3000));
  fireEvent.press(screen.getByText("Discard"));
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

describe("DiscardMeetingModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockDiscardRecording.mockResolvedValue(undefined);
    mockDiscardMeeting.mockResolvedValue(undefined);

    (useAudioRecording as jest.Mock).mockReturnValue({
      discardRecording: mockDiscardRecording,
      resumeRecording: mockResumeRecording,
    });
    (useDiscardMeeting as jest.Mock).mockReturnValue({
      mutateAsync: mockDiscardMeeting,
    });

    useActiveMeetingStore.setState({
      meetingId: MEETING_ID,
      person: mockPerson,
      personType: "client",
      cleanup: mockCleanup,
      showDiscardModal: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("discards the recording and the meeting, then cleans up", async () => {
    await pressDiscard();

    expect(mockDiscardRecording).toHaveBeenCalled();
    expect(mockDiscardMeeting).toHaveBeenCalledWith({
      meetingId: MEETING_ID,
      personId: "person-1",
      personType: "client",
    });
    expect(Sentry.logger.info).toHaveBeenCalledWith("meeting.discard", {
      meetingId: MEETING_ID,
    });
    expect(mockCleanup).toHaveBeenCalled();
  });

  it("does nothing when the store has no meetingId", async () => {
    useActiveMeetingStore.setState({ meetingId: null });

    await pressDiscard();

    expect(mockDiscardRecording).not.toHaveBeenCalled();
  });

  it("logs and stops when discarding the meeting fails", async () => {
    mockDiscardMeeting.mockRejectedValueOnce(new Error("discard failed"));

    await pressDiscard();

    expect(Sentry.logger.error).toHaveBeenCalledWith(
      "meeting.discard.error",
      expect.objectContaining({ meetingId: MEETING_ID }),
    );
    expect(mockCleanup).not.toHaveBeenCalled();
    expect(useActiveMeetingStore.getState().controlsDisabled).toBe(false);
  });

  it("closes the dialog and resumes recording on cancel", () => {
    render(<DiscardMeetingModal />);
    fireEvent.press(screen.getByText("Cancel"));

    expect(useActiveMeetingStore.getState().showDiscardModal).toBe(false);
    expect(mockResumeRecording).toHaveBeenCalled();
  });
});
