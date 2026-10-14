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
import { Platform } from "react-native";

import { useEndMeeting } from "~@meetings/app/entities/meeting";
import { useUploadSegment } from "~@meetings/app/shared/api";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";

import { useActiveMeetingStore } from "../model/activeMeetingStore";
import { useAudioRecording } from "../model/RecordingProvider";
import { EndMeetingModal } from "./EndMeetingModal";

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
  useEndMeeting: jest.fn(),
}));

jest.mock("~@meetings/app/shared/api", () => ({
  useUploadSegment: jest.fn(),
}));

jest.mock("~@meetings/app/shared/lib/useIsOnline", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockFinalizeRecording = jest.fn();
const mockResumeRecording = jest.fn();
const mockEndMeeting = jest.fn();
const mockUpload = jest.fn();
const mockCleanup = jest.fn();

async function pressFinishAndSave() {
  render(<EndMeetingModal />);
  fireEvent.press(screen.getByText("Finish & Save"));
  await act(async () => {
    await jest.runAllTimersAsync();
  });
}

describe("EndMeetingModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFinalizeRecording.mockResolvedValue("file://recording.m4a");
    mockEndMeeting.mockResolvedValue(undefined);
    mockUpload.mockResolvedValue(undefined);

    (useAudioRecording as jest.Mock).mockReturnValue({
      finalizeRecording: mockFinalizeRecording,
      resumeRecording: mockResumeRecording,
    });
    (useEndMeeting as jest.Mock).mockReturnValue({
      mutateAsync: mockEndMeeting,
    });
    (useUploadSegment as jest.Mock).mockReturnValue(mockUpload);
    (useIsOnline as jest.Mock).mockReturnValue({ isOnline: true });

    useActiveMeetingStore.setState({
      meetingId: MEETING_ID,
      person: mockPerson,
      personType: "client",
      note: "test note",
      cleanup: mockCleanup,
      showEndModal: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("finalizes recording, uploads, ends meeting, and cleans up", async () => {
    await pressFinishAndSave();

    expect(mockFinalizeRecording).toHaveBeenCalled();
    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: "file://recording.m4a",
        meetingId: MEETING_ID,
        fileExtension: "m4a",
        contentType: "audio/m4a",
      }),
    );
    expect(Sentry.logger.info).toHaveBeenCalledWith("upload.done", {
      meetingId: MEETING_ID,
    });
    expect(mockEndMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        meetingId: MEETING_ID,
        personId: "person-1",
        personType: "client",
        userNotepadNotes: "test note",
        queueForRetry: false,
      }),
    );
    expect(Sentry.logger.info).toHaveBeenCalledWith("meeting.end", {
      meetingId: MEETING_ID,
    });
    expect(mockCleanup).toHaveBeenCalled();
  });

  it("does not finalize when the store has no meetingId", async () => {
    useActiveMeetingStore.setState({ meetingId: null });

    await pressFinishAndSave();

    expect(mockFinalizeRecording).not.toHaveBeenCalled();
  });

  it("skips the upload and queues the meeting when offline", async () => {
    (useIsOnline as jest.Mock).mockReturnValue({ isOnline: false });

    await pressFinishAndSave();

    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockEndMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ queueForRetry: false }),
    );
    expect(mockCleanup).toHaveBeenCalled();
  });

  it("logs and queues the meeting for retry when the upload fails", async () => {
    const uploadErr = new Error("network error");
    mockUpload.mockRejectedValueOnce(uploadErr);

    await pressFinishAndSave();

    expect(Sentry.logger.error).toHaveBeenCalledWith(
      "upload.error",
      expect.objectContaining({ meetingId: MEETING_ID }),
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(uploadErr, {
      tags: { meetingId: MEETING_ID },
    });
    expect(mockEndMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ queueForRetry: true }),
    );
    expect(mockCleanup).toHaveBeenCalled();
  });

  it("logs and stops when finalizing the recording fails", async () => {
    const finalizeErr = new Error("recorder error");
    mockFinalizeRecording.mockRejectedValueOnce(finalizeErr);

    await pressFinishAndSave();

    expect(Sentry.logger.error).toHaveBeenCalledWith(
      "recording.finalize.error",
      expect.objectContaining({ meetingId: MEETING_ID }),
    );
    expect(mockEndMeeting).not.toHaveBeenCalled();
    expect(mockCleanup).not.toHaveBeenCalled();
    expect(useActiveMeetingStore.getState().controlsDisabled).toBe(false);
  });

  it("passes the audio file URI on native", async () => {
    await pressFinishAndSave();

    expect(mockEndMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUri: "file://recording.m4a",
        audioBlob: undefined,
      }),
    );
  });

  it("passes the audio blob on web", async () => {
    const originalOS = Platform.OS;
    Platform.OS = "web" as typeof Platform.OS;
    const mockBlob = new Blob(["audio"], { type: "audio/mp4" });
    global.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    });

    await pressFinishAndSave();

    expect(mockEndMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ audioBlob: mockBlob, audioUri: undefined }),
    );
    Platform.OS = originalOS;
  });

  it("logs and stops when ending the meeting fails", async () => {
    const endErr = new Error("server error");
    mockEndMeeting.mockRejectedValueOnce(endErr);

    await pressFinishAndSave();

    expect(Sentry.logger.error).toHaveBeenCalledWith(
      "meeting.end.error",
      expect.objectContaining({
        meetingId: MEETING_ID,
        error: "Error: server error",
      }),
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(endErr, {
      tags: { meetingId: MEETING_ID },
    });
    expect(mockCleanup).not.toHaveBeenCalled();
    expect(useActiveMeetingStore.getState().controlsDisabled).toBe(false);
  });

  it("sends an empty note as undefined", async () => {
    useActiveMeetingStore.setState({ note: "" });

    await pressFinishAndSave();

    expect(mockEndMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ userNotepadNotes: undefined }),
    );
  });

  it("closes the dialog and resumes recording on cancel", () => {
    render(<EndMeetingModal />);
    fireEvent.press(screen.getByText("Cancel"));

    expect(useActiveMeetingStore.getState().showEndModal).toBe(false);
    expect(mockResumeRecording).toHaveBeenCalled();
  });
});
