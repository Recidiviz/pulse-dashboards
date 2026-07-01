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

import { act, renderHook } from "@testing-library/react-native";
import React from "react";

import {
  useDiscardMeeting,
  useEndMeeting,
} from "~@meetings/app/entities/meeting";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";

import { useUploadSegment } from "../../../../shared/api";
import { RecordingProvider, useRecording } from "..";
import { useRecordingStore, useRecordingStoreHydrated } from "../store";
import { useWebAudioRecorder } from "../useAudioRecorder.web";
import { useDurationTimer } from "../useDurationTimer";
import { useInitialization } from "../useInitialization.web";

jest.mock("idb", () => ({ openDB: jest.fn() }));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../useAudioRecorder.web");
jest.mock("../../lib/webRecorderDb.web");
jest.mock("~@meetings/app/entities/meeting/model/useDiscardMeeting");
jest.mock("~@meetings/app/entities/meeting/model/useEndMeeting");
jest.mock("~@meetings/app/shared/lib/useIsOnline", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ isOnline: true }),
}));
jest.mock("../useDurationTimer");
jest.mock("../useInitialization.web", () => ({
  useInitialization: jest.fn(),
}));
jest.mock("~@meetings/app/shared/api/upload-segment");
jest.mock("../../ui/MeetingModal", () => ({
  MeetingModal: () => null,
}));
jest.mock("../store");
jest.mock("~@meetings/app/entities/user", () => ({
  useUserContext: jest.fn().mockReturnValue({
    getCredentials: jest.fn().mockResolvedValue({}),
    isSkipAuthUser: false,
  }),
}));
// Prevent jest-expo from resolving the barrel to model.native.tsx
jest.mock("../RecordingProvider", () => {
  const {
    RecordingContext,
    RecordingProvider,
  } = require("../RecordingProvider.web");
  const { useContext } = require("react");
  return {
    RecordingContext,
    RecordingProvider,
    useRecording: () => {
      const ctx = useContext(RecordingContext);
      if (!ctx)
        throw new Error("useRecording must be used within RecordingProvider");
      return ctx;
    },
  };
});

const mockPerson = { personId: "person-1", fullName: "John Doe" };
const MEETING_ID = "meeting-1";
const MEETING_TYPE = "Assessment";
const BLOB_URL = "blob:test-url";

const mockSetStatus = jest.fn();
const mockSetNote = jest.fn();
const mockSetMeetingId = jest.fn();
const mockSetMeetingType = jest.fn();
const mockSetMeetingTypeCategory = jest.fn();
const mockSetPerson = jest.fn();
const mockSetMinimized = jest.fn();
const mockSetPersistedDurationMs = jest.fn();

const mockUploadSegment = jest.fn().mockResolvedValue(undefined);
const mockEndMeeting = jest.fn().mockResolvedValue(undefined);
const mockDiscardMeeting = jest.fn().mockResolvedValue(undefined);

const mockTimerStart = jest.fn();
const mockTimerStop = jest.fn().mockReturnValue(5000);
const mockTimerReset = jest.fn();
const mockTimerSetInitial = jest.fn();

const mockRecorderStart = jest.fn().mockResolvedValue(undefined);
const mockRecorderStop = jest
  .fn()
  .mockResolvedValue(new Blob(["audio"], { type: "audio/webm" }));
const mockRecorderCleanup = jest.fn().mockResolvedValue(undefined);

const defaultStoreValues = {
  status: "idle" as const,
  note: "",
  isRecordingViewMinimized: false,
  durationMs: 0,
  meetingId: MEETING_ID,
  person: mockPerson,
  setStatus: mockSetStatus,
  setNote: mockSetNote,
  setMeetingId: mockSetMeetingId,
  setMeetingType: mockSetMeetingType,
  setMeetingTypeCategory: mockSetMeetingTypeCategory,
  setPerson: mockSetPerson,
  setIsRecordingViewMinimized: mockSetMinimized,
  setDurationMs: mockSetPersistedDurationMs,
};

function buildWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <RecordingProvider>{children}</RecordingProvider>
  );
}

describe("RecordingProvider (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRecordingStore as unknown as jest.Mock).mockReturnValue(
      defaultStoreValues,
    );
    (useRecordingStoreHydrated as unknown as jest.Mock).mockReturnValue(true);
    (useInitialization as jest.Mock).mockReturnValue(undefined);

    (useDurationTimer as jest.Mock).mockReturnValue({
      durationMs: 0,
      start: mockTimerStart,
      stop: mockTimerStop,
      reset: mockTimerReset,
      setInitialDurationMs: mockTimerSetInitial,
    });

    (useUploadSegment as jest.Mock).mockReturnValue(mockUploadSegment);
    (useEndMeeting as jest.Mock).mockReturnValue({
      mutateAsync: mockEndMeeting,
    });
    (useDiscardMeeting as jest.Mock).mockReturnValue({
      mutateAsync: mockDiscardMeeting,
    });

    (useWebAudioRecorder as jest.Mock).mockReturnValue({
      start: mockRecorderStart,
      stop: mockRecorderStop,
      cleanup: mockRecorderCleanup,
      isRecording: false,
    });

    global.URL.createObjectURL = jest.fn().mockReturnValue(BLOB_URL);
    global.URL.revokeObjectURL = jest.fn();
    global.alert = jest.fn();
    (useIsOnline as jest.Mock).mockReturnValue({ isOnline: true });
  });

  it("provides correct initial context values", () => {
    const { result } = renderHook(() => useRecording<"web">(), {
      wrapper: buildWrapper(),
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.isRecording).toBe(false);
    expect(result.current.durationMs).toBe(0);
    expect(result.current.hasHydrated).toBe(true);
    expect(result.current.meetingId).toBe(MEETING_ID);
    expect(result.current.person).toEqual(mockPerson);
  });

  describe("openRecordingView / closeRecordingView", () => {
    it("sets meetingId and person when opening", () => {
      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      act(() => {
        result.current.openRecordingView({
          meetingId: "m2",
          person: mockPerson as never,
          meetingType: MEETING_TYPE,
          meetingTypeCategory: null,
        });
      });

      expect(mockSetMeetingId).toHaveBeenCalledWith("m2");
      expect(mockSetPerson).toHaveBeenCalledWith(mockPerson);
      expect(mockSetMeetingType).toHaveBeenCalledWith(MEETING_TYPE);
      expect(mockSetMeetingTypeCategory).toHaveBeenCalledWith(null);
    });

    it("clears meetingId, person and minimized flag when closing", () => {
      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      act(() => {
        result.current.closeRecordingView();
      });

      expect(mockSetMeetingId).toHaveBeenCalledWith(null);
      expect(mockSetPerson).toHaveBeenCalledWith(null);
      expect(mockSetMinimized).toHaveBeenCalledWith(false);
    });
  });

  describe("startRecording", () => {
    it("starts recorder, timer and sets recording status", async () => {
      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockRecorderStart).toHaveBeenCalled();
      expect(mockTimerStart).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("recording");
    });

    it("calls alert when recorder.start throws", async () => {
      mockRecorderStart.mockRejectedValueOnce(new Error("mic denied"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(global.alert).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("togglePauseResume", () => {
    it("pauses (uploads and stops timer) when recording", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        status: "recording",
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
      expect(mockUploadSegment).toHaveBeenCalled();
      expect(mockTimerStop).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("paused");
    });

    it("resumes (calls startRecording) when paused", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        status: "paused",
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
      expect(mockRecorderStart).toHaveBeenCalled();
      expect(mockTimerStart).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("recording");
    });

    it("when offline: resumes without uploading and preserves the blob for endMeeting", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/webm" });
      mockRecorderStop.mockResolvedValueOnce(mockBlob);

      (useIsOnline as jest.Mock).mockReturnValue({ isOnline: false });
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        status: "paused",
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      // Resume offline — the stopped segment can't be uploaded, so it's stored
      // in pendingOfflineBlobRef before a fresh recording starts.
      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
      expect(mockUploadSegment).not.toHaveBeenCalled();
      expect(mockRecorderStart).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("recording");

      // The preserved blob is handed to endMeeting on finish (the recorder
      // reports not recording in the mock, so the pending offline blob is used).
      await act(async () => {
        await result.current.handleFinishAndSave();
      });

      expect(mockEndMeeting).toHaveBeenCalledWith(
        expect.objectContaining({ audioBlob: mockBlob }),
      );
    });

    it("does nothing when uploading", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        status: "uploading",
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockRecorderStart).not.toHaveBeenCalled();
      expect(mockRecorderStop).not.toHaveBeenCalled();
    });
  });

  describe("stopRecording", () => {
    it("pauses upload first then sets stopping when recording", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        status: "recording",
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
      expect(mockUploadSegment).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("stopping");
    });

    it("sets stopping without pausing when already paused", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        status: "paused",
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(mockRecorderStop).not.toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("stopping");
    });
  });

  describe("discardRecording", () => {
    it("pauses upload first then sets discarding when recording", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        status: "recording",
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.discardRecording();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
      expect(mockUploadSegment).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("discarding");
    });
  });

  describe("cleanupRecording", () => {
    it("cleans recorder, resets timer, clears note and sets idle", async () => {
      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.cleanupRecording();
      });

      expect(mockRecorderCleanup).toHaveBeenCalled();
      expect(mockTimerReset).toHaveBeenCalled();
      expect(mockSetPersistedDurationMs).toHaveBeenCalledWith(0);
      expect(mockSetStatus).toHaveBeenCalledWith("idle");
      expect(mockSetNote).toHaveBeenCalledWith("");
    });
  });

  describe("handleFinishAndSave", () => {
    it("ends meeting, cleans up and closes recording view", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        note: "my notes",
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleFinishAndSave();
      });

      expect(mockEndMeeting).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
        userNotepadNotes: "my notes",
        personId: mockPerson.personId,
        personType: "resident",
        audioBlob: undefined,
        endTime: expect.any(Date),
        person: mockPerson,
      });
      expect(mockRecorderCleanup).toHaveBeenCalled();
      expect(mockSetMeetingId).toHaveBeenCalledWith(null);
    });

    it("stops and uploads first if recorder is active", async () => {
      (useWebAudioRecorder as jest.Mock).mockReturnValue({
        start: mockRecorderStart,
        stop: mockRecorderStop,
        cleanup: mockRecorderCleanup,
        isRecording: true,
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleFinishAndSave();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
      expect(mockUploadSegment).toHaveBeenCalled();
      expect(mockEndMeeting).toHaveBeenCalled();
    });

    it("throws when meetingId is missing", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        meetingId: null,
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await expect(result.current.handleFinishAndSave()).rejects.toThrow(
          "Cannot end meeting without a meeting ID and person",
        );
      });
    });

    it("when offline: passes blob from stopped recording to endMeeting", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/webm" });
      mockRecorderStop.mockResolvedValueOnce(mockBlob);

      (useIsOnline as jest.Mock).mockReturnValue({ isOnline: false });
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        status: "recording",
        note: "my notes",
      });
      (useWebAudioRecorder as jest.Mock).mockReturnValue({
        start: mockRecorderStart,
        stop: mockRecorderStop,
        cleanup: mockRecorderCleanup,
        isRecording: true,
      });

      const { result, rerender } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      // Stop recording offline — blob is stored in pendingOfflineBlobRef
      await act(async () => {
        await result.current.stopRecording();
      });

      // Simulate recorder having fully stopped
      (useWebAudioRecorder as jest.Mock).mockReturnValue({
        start: mockRecorderStart,
        stop: mockRecorderStop,
        cleanup: mockRecorderCleanup,
        isRecording: false,
      });
      rerender(() => useRecording<"web">());

      await act(async () => {
        await result.current.handleFinishAndSave();
      });

      expect(mockUploadSegment).not.toHaveBeenCalled();
      expect(mockEndMeeting).toHaveBeenCalledWith(
        expect.objectContaining({ audioBlob: mockBlob }),
      );
    });

    it("shows alert and resets to paused when endMeeting fails", async () => {
      mockEndMeeting.mockRejectedValueOnce(new Error("Server error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleFinishAndSave();
      });

      expect(global.alert).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("paused");
      consoleSpy.mockRestore();
    });
  });

  describe("handleFinalDiscard", () => {
    it("cleans up recording and discards meeting", async () => {
      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleFinalDiscard();
      });

      expect(mockRecorderCleanup).toHaveBeenCalled();
      expect(mockDiscardMeeting).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
        personId: mockPerson.personId,
        personType: "resident",
      });
      expect(mockSetMeetingId).toHaveBeenCalledWith(null);
    });

    it("throws when meetingId is missing", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        meetingId: null,
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await expect(result.current.handleFinalDiscard()).rejects.toThrow(
          "Cannot discard meeting without a meeting ID and person",
        );
      });
    });
  });
});
