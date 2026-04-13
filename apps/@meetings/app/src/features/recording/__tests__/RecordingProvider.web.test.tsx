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

import { useUploadSegment } from "~@meetings/app/entities/upload-segment";
import { useDiscardMeeting } from "~@meetings/app/hooks/useDiscardMeeting";
import { useEndMeeting } from "~@meetings/app/hooks/useEndMeeting";
import useIsOnline from "~@meetings/app/hooks/useIsOnline";
import { AUDIO_FORMATS } from "~@meetings/config";

import { useWebAudioRecorder } from "../hooks/useAudioRecorder.web";
import { useDurationTimer } from "../hooks/useDurationTimer";
import { useInitialization } from "../hooks/useInitialization.web";
import { RecordingProvider, useRecording } from "../model";
import { useRecordingStore, useRecordingStoreHydrated } from "../model/store";

jest.mock("idb", () => ({ openDB: jest.fn() }));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../hooks/useAudioRecorder.web");
jest.mock("../utils/webRecorderDb.web");
jest.mock("~@meetings/app/hooks/useDiscardMeeting");
jest.mock("~@meetings/app/hooks/useEndMeeting");
jest.mock("~@meetings/app/hooks/useIsOnline", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ isOnline: true }),
}));
jest.mock("../hooks/useDurationTimer");
jest.mock("../hooks/useInitialization.web", () => ({
  useInitialization: jest.fn(),
}));
jest.mock("~@meetings/app/entities/upload-segment");
jest.mock("../ui/MeetingModal", () => ({
  MeetingModal: () => null,
}));
jest.mock("../model/store");
// Prevent jest-expo from resolving the barrel to model.native.tsx
jest.mock("../model", () => {
  const { RecordingContext, RecordingProvider } = require("../model/model.web");
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
const BLOB_URL = "blob:test-url";

const mockSetStatus = jest.fn();
const mockSetNote = jest.fn();
const mockSetMeetingId = jest.fn();
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
        });
      });

      expect(mockSetMeetingId).toHaveBeenCalledWith("m2");
      expect(mockSetPerson).toHaveBeenCalledWith(mockPerson);
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

  describe("stopAndUploadRecording", () => {
    it("stops recorder, uploads blob and cleans up", async () => {
      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.stopAndUploadRecording();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockUploadSegment).toHaveBeenCalledWith({
        uri: BLOB_URL,
        meetingId: MEETING_ID,
        contentType: AUDIO_FORMATS.webm.contentType,
        fileExtension: AUDIO_FORMATS.webm.extension,
      });
      expect(mockRecorderCleanup).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(BLOB_URL);
    });

    it("warns and returns early when recorder returns no blob", async () => {
      mockRecorderStop.mockResolvedValueOnce(null);
      const warnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.stopAndUploadRecording();
      });

      expect(mockUploadSegment).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("throws when meetingId is not set", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreValues,
        meetingId: null,
      });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await expect(result.current.stopAndUploadRecording()).rejects.toThrow(
          "meetingId is required for uploading",
        );
      });
    });

    it("when offline: stops recorder, returns blob without uploading or cleaning up", async () => {
      (useIsOnline as jest.Mock).mockReturnValue({ isOnline: false });

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      let returnedBlob: Blob | null = null;
      await act(async () => {
        returnedBlob = await result.current.stopAndUploadRecording();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
      expect(mockUploadSegment).not.toHaveBeenCalled();
      expect(mockRecorderCleanup).not.toHaveBeenCalled();
      expect(returnedBlob).toBeInstanceOf(Blob);
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
      mockRecorderStop.mockResolvedValueOnce(null);
      const warnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);

      const { result } = renderHook(() => useRecording<"web">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockRecorderStart).toHaveBeenCalled();
      expect(mockTimerStart).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("recording");
      warnSpy.mockRestore();
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

    it("shows alert and resets to idle when endMeeting fails", async () => {
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
      expect(mockSetStatus).toHaveBeenCalledWith("idle");
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
