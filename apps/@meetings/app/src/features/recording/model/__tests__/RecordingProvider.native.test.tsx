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

import { NavigationContainer } from "@react-navigation/native";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import React from "react";
import { Alert } from "react-native";

import { useDiscardMeeting } from "~@meetings/app/hooks/useDiscardMeeting";
import { useEndMeeting } from "~@meetings/app/hooks/useEndMeeting";
import { useUpdateNotes } from "~@meetings/app/hooks/useUpdateNotesMutation";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { AUDIO_FORMATS } from "~@meetings/config";

import { useUploadSegment } from "../../../../shared/api";
import * as notifications from "../../lib/notifications";
import * as storage from "../../lib/storage";
import { RecordingProvider, useRecording } from "..";
import { useRecordingStore, useRecordingStoreHydrated } from "../store";
import { useDurationTimer } from "../useDurationTimer";
import { useNote } from "../useNote";
import { usePersistedFileDuration } from "../usePersistedFileDuration.native";
import { useRecordingStatus } from "../useRecordingStatus";

jest.mock("expo-audio", () => ({
  AudioModule: { requestRecordingPermissionsAsync: jest.fn() },
  RecordingPresets: { HIGH_QUALITY: {} },
  setAudioModeAsync: jest.fn(),
  useAudioRecorder: jest.fn(),
  useAudioRecorderState: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("~@meetings/app/hooks/useDiscardMeeting");
jest.mock("~@meetings/app/hooks/useEndMeeting");
jest.mock("~@meetings/app/shared/lib/useIsOnline", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ isOnline: true }),
}));
jest.mock("~@meetings/app/hooks/useUpdateNotesMutation");
jest.mock("../useDurationTimer");
jest.mock("../useNote");
jest.mock("../usePersistedFileDuration.native", () => ({
  usePersistedFileDuration: jest.fn(),
}));
jest.mock("../useRecordingStatus");
jest.mock("~@meetings/app/shared/api/upload-segment");
jest.mock("../../lib/notifications");
jest.mock("../../lib/storage");
jest.mock("../store");

const mockPerson = {
  personId: "person-1",
  personType: "client",
  fullName: "John Doe",
};
const MEETING_ID = "meeting-1";
const RECORDING_URI = "file://test-recording.m4a";

const mockSetStatus = jest.fn().mockResolvedValue(undefined);
const mockSetNote = jest.fn();
const mockUploadSegment = jest.fn().mockResolvedValue(undefined);
const mockEndMeeting = jest.fn().mockResolvedValue(undefined);
const mockDiscardMeeting = jest.fn().mockResolvedValue(undefined);
const mockUpdateNotes = jest.fn();
const mockTimerStart = jest.fn();
const mockTimerStop = jest.fn().mockReturnValue(5000);
const mockTimerReset = jest.fn();
const mockTimerSetInitial = jest.fn();
const mockSetPersistedDurationMs = jest.fn();

const mockAudioRecorder = {
  prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
  record: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  uri: RECORDING_URI,
};

function buildWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <NavigationContainer>
      <RecordingProvider>{children}</RecordingProvider>
    </NavigationContainer>
  );
}

describe("RecordingProvider (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation();

    (useRecordingStatus as jest.Mock).mockReturnValue(["idle", mockSetStatus]);
    (useNote as jest.Mock).mockReturnValue(["", mockSetNote]);
    (useAudioRecorder as jest.Mock).mockReturnValue(mockAudioRecorder);
    (useAudioRecorderState as jest.Mock).mockReturnValue({
      isRecording: false,
    });
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
    (usePersistedFileDuration as jest.Mock).mockReturnValue({
      durationMs: null,
    });
    (useRecordingStore as unknown as jest.Mock).mockReturnValue({
      meetingId: MEETING_ID,
      setMeetingId: jest.fn(),
      meetingType: null,
      setMeetingType: jest.fn(),
      person: mockPerson,
      personType: null,
      setPerson: jest.fn(),
      setPersonType: jest.fn(),
      durationMs: 0,
      setDurationMs: mockSetPersistedDurationMs,
    });
    (useRecordingStoreHydrated as unknown as jest.Mock).mockReturnValue(true);
    (useUpdateNotes as jest.Mock).mockReturnValue({
      mutate: mockUpdateNotes,
    });

    (
      AudioModule.requestRecordingPermissionsAsync as jest.Mock
    ).mockResolvedValue({ granted: true });
    (setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    (storage.getRecordingUri as jest.Mock).mockResolvedValue(null);
    (storage.getRecordingState as jest.Mock).mockResolvedValue("idle");
    (storage.saveRecordingUri as jest.Mock).mockResolvedValue(undefined);
    (storage.removeRecordingUri as jest.Mock).mockResolvedValue(undefined);
    (storage.setRecordingState as jest.Mock).mockResolvedValue(undefined);

    (notifications.requestNotificationPermissions as jest.Mock).mockReturnValue(
      undefined,
    );
    (notifications.sendNotification as jest.Mock).mockReturnValue(undefined);
    (useIsOnline as jest.Mock).mockReturnValue({ isOnline: true });
  });

  it("provides correct initial context values", async () => {
    const { result } = renderHook(() => useRecording<"native">(), {
      wrapper: buildWrapper(),
    });

    await waitFor(() =>
      expect(AudioModule.requestRecordingPermissionsAsync).toHaveBeenCalled(),
    );

    expect(result.current.status).toBe("idle");
    expect(result.current.isRecording).toBe(false);
    expect(result.current.durationMs).toBe(0);
    expect(result.current.hasHydrated).toBe(true);
    expect(result.current.meetingId).toBe(MEETING_ID);
    expect(result.current.person).toEqual(mockPerson);
  });

  describe("startRecording", () => {
    it("prepares recorder, saves URI, starts timer and sets status", async () => {
      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockAudioRecorder.prepareToRecordAsync).toHaveBeenCalled();
      expect(mockAudioRecorder.record).toHaveBeenCalled();
      expect(storage.saveRecordingUri).toHaveBeenCalledWith(RECORDING_URI);
      expect(mockTimerStart).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("recording");
    });
  });

  describe("stopAndUploadRecording", () => {
    it("stops active recorder, uploads file and removes URI", async () => {
      (useAudioRecorderState as jest.Mock).mockReturnValue({
        isRecording: true,
      });
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(RECORDING_URI);

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.stopAndUploadRecording();
      });

      expect(mockAudioRecorder.stop).toHaveBeenCalled();
      expect(mockUploadSegment).toHaveBeenCalledWith({
        uri: RECORDING_URI,
        meetingId: MEETING_ID,
        contentType: AUDIO_FORMATS.m4a.contentType,
        fileExtension: AUDIO_FORMATS.m4a.extension,
      });
      expect(storage.removeRecordingUri).toHaveBeenCalled();
    });

    it("warns and still removes URI when no recording file found", async () => {
      (useAudioRecorderState as jest.Mock).mockReturnValue({
        isRecording: false,
      });
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(null);
      const mockRecorderNoUri = { ...mockAudioRecorder, uri: null };
      (useAudioRecorder as jest.Mock).mockReturnValue(mockRecorderNoUri);
      const warnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.stopAndUploadRecording();
      });

      expect(mockUploadSegment).not.toHaveBeenCalled();
      expect(storage.removeRecordingUri).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("throws when meetingId is not set", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        meetingId: null,
        setMeetingId: jest.fn(),
        person: mockPerson,
        setPerson: jest.fn(),
        durationMs: 0,
        setDurationMs: mockSetPersistedDurationMs,
      });

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await expect(result.current.stopAndUploadRecording()).rejects.toThrow();
      });
    });
  });

  describe("togglePauseResume", () => {
    it("starts recording when status is paused", async () => {
      (useRecordingStatus as jest.Mock).mockReturnValue([
        "paused",
        mockSetStatus,
      ]);

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockAudioRecorder.prepareToRecordAsync).toHaveBeenCalled();
      expect(mockTimerStart).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("recording");
    });

    it("syncs notes, stops timer, uploads and sets paused when recording", async () => {
      (useRecordingStatus as jest.Mock).mockReturnValue([
        "recording",
        mockSetStatus,
      ]);
      (useNote as jest.Mock).mockReturnValue(["my notes", mockSetNote]);
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(RECORDING_URI);

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockUpdateNotes).toHaveBeenCalledWith(
        {
          meetingId: MEETING_ID,
          userNotepadNotes: "my notes",
        },
        expect.objectContaining({ onError: expect.any(Function) }),
      );
      expect(mockTimerStop).toHaveBeenCalled();
      expect(mockUploadSegment).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("paused");
    });

    it("does nothing when status is uploading", async () => {
      (useRecordingStatus as jest.Mock).mockReturnValue([
        "uploading",
        mockSetStatus,
      ]);

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockAudioRecorder.prepareToRecordAsync).not.toHaveBeenCalled();
      expect(mockUploadSegment).not.toHaveBeenCalled();
    });

    it("when offline: stops recorder, saves URI, sets paused without uploading", async () => {
      (useIsOnline as jest.Mock).mockReturnValue({ isOnline: false });
      (useRecordingStatus as jest.Mock).mockReturnValue([
        "recording",
        mockSetStatus,
      ]);
      (useAudioRecorderState as jest.Mock).mockReturnValue({
        isRecording: true,
      });
      (useNote as jest.Mock).mockReturnValue(["my notes", mockSetNote]);

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.togglePauseResume();
      });

      expect(mockAudioRecorder.stop).toHaveBeenCalled();
      expect(storage.saveRecordingUri).toHaveBeenCalledWith(RECORDING_URI);
      expect(mockSetStatus).toHaveBeenCalledWith("paused");
      expect(mockUploadSegment).not.toHaveBeenCalled();
    });
  });

  describe("cleanupRecording", () => {
    it("removes URI, resets timer, clears duration and sets idle", async () => {
      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.cleanupRecording();
      });

      expect(storage.removeRecordingUri).toHaveBeenCalled();
      expect(mockTimerReset).toHaveBeenCalled();
      expect(mockSetPersistedDurationMs).toHaveBeenCalledWith(0);
      expect(mockSetStatus).toHaveBeenCalledWith("idle");
    });
  });

  describe("handleFinishAndSave", () => {
    it("ends meeting and cleans up state", async () => {
      (useNote as jest.Mock).mockReturnValue(["my notes", mockSetNote]);

      const onComplete = jest.fn();
      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleFinishAndSave(onComplete);
      });

      expect(mockEndMeeting).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
        userNotepadNotes: "my notes",
        personId: mockPerson.personId,
        personType: "resident",
        audioUri: RECORDING_URI,
        endTime: expect.any(Date),
        person: mockPerson,
      });
      expect(storage.removeRecordingUri).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it("throws when meetingId is missing", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        meetingId: null,
        setMeetingId: jest.fn(),
        person: mockPerson,
        setPerson: jest.fn(),
        durationMs: 0,
        setDurationMs: mockSetPersistedDurationMs,
      });

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await expect(result.current.handleFinishAndSave()).rejects.toThrow(
          "Cannot end meeting without a meeting ID and person",
        );
      });
    });

    it("shows alert and resets to idle when endMeeting fails", async () => {
      mockEndMeeting.mockRejectedValueOnce(new Error("Server error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleFinishAndSave();
      });

      expect(Alert.alert).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("idle");
      consoleSpy.mockRestore();
    });
  });

  describe("handleFinalDiscard", () => {
    it("cleans up recording and calls discardMeeting", async () => {
      const onComplete = jest.fn();
      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleFinalDiscard(onComplete);
      });

      expect(storage.removeRecordingUri).toHaveBeenCalled();
      expect(mockDiscardMeeting).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
        personId: mockPerson.personId,
        personType: "resident",
      });
      expect(onComplete).toHaveBeenCalled();
    });

    it("throws when meetingId is missing", async () => {
      (useRecordingStore as unknown as jest.Mock).mockReturnValue({
        meetingId: null,
        setMeetingId: jest.fn(),
        person: mockPerson,
        setPerson: jest.fn(),
        durationMs: 0,
        setDurationMs: mockSetPersistedDurationMs,
      });

      const { result } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await expect(result.current.handleFinalDiscard()).rejects.toThrow(
          "Cannot discard meeting without a meeting ID and person",
        );
      });
    });
  });

  describe("initializeRecording", () => {
    it("shows alert and returns early when microphone permission is denied", async () => {
      (
        AudioModule.requestRecordingPermissionsAsync as jest.Mock
      ).mockResolvedValue({ granted: false });

      renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() =>
        expect(AudioModule.requestRecordingPermissionsAsync).toHaveBeenCalled(),
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        "Permission to access microphone was denied",
      );
      expect(setAudioModeAsync).not.toHaveBeenCalled();
    });

    it("resets to idle and removes URI when persisted file is missing", async () => {
      (storage.getRecordingState as jest.Mock).mockResolvedValue("recording");
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(RECORDING_URI);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() =>
        expect(storage.setRecordingState).toHaveBeenCalledWith("idle"),
      );

      expect(storage.removeRecordingUri).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("idle");
    });

    it("ends the meeting when recovering from a stuck non-idle state with a missing file", async () => {
      (storage.getRecordingState as jest.Mock).mockResolvedValue("uploading");
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(RECORDING_URI);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() =>
        expect(mockEndMeeting).toHaveBeenCalledWith({
          meetingId: MEETING_ID,
          personId: mockPerson.personId,
          personType: "resident",
        }),
      );
      expect(storage.setRecordingState).toHaveBeenCalledWith("idle");
    });

    it("still recovers and ends the meeting when the upload throws during recovery", async () => {
      (storage.getRecordingState as jest.Mock).mockResolvedValue("uploading");
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(RECORDING_URI);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      // Make stopAndUploadRecording re-throw on a failed upload so we exercise
      // the catch that must still let recovery finish.
      (useAudioRecorderState as jest.Mock).mockReturnValue({
        isRecording: true,
      });
      mockUploadSegment.mockRejectedValueOnce(new Error("upload failed"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() =>
        expect(storage.setRecordingState).toHaveBeenCalledWith("idle"),
      );
      expect(mockEndMeeting).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("resets to idle when persisted state is recording but no URI exists", async () => {
      (storage.getRecordingState as jest.Mock).mockResolvedValue("recording");
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(null);

      renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() =>
        expect(storage.setRecordingState).toHaveBeenCalledWith("idle"),
      );

      expect(mockSetStatus).toHaveBeenCalledWith("idle");
    });

    it("restores persisted non-recording status on mount", async () => {
      (storage.getRecordingState as jest.Mock).mockResolvedValue("paused");
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(RECORDING_URI);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
      });

      renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() => expect(mockSetStatus).toHaveBeenCalledWith("paused"));
    });
  });

  describe("auto-stop at 90-minute limit", () => {
    it("uploads, sets paused and sends notification when recorder stops unexpectedly", async () => {
      (useRecordingStatus as jest.Mock).mockReturnValue([
        "recording",
        mockSetStatus,
      ]);
      (storage.getRecordingUri as jest.Mock).mockResolvedValue(RECORDING_URI);

      let mockIsRecording = true;
      (useAudioRecorderState as jest.Mock).mockImplementation(() => ({
        isRecording: mockIsRecording,
      }));

      const { rerender } = renderHook(() => useRecording<"native">(), {
        wrapper: buildWrapper(),
      });

      // Wait for initial mount effects to settle (prevRef gets set to true)
      await waitFor(() =>
        expect(AudioModule.requestRecordingPermissionsAsync).toHaveBeenCalled(),
      );

      // Simulate the recorder stopping (90-min limit reached)
      await act(async () => {
        mockIsRecording = false;
        (rerender as VoidFunction)();
      });

      await waitFor(() =>
        expect(mockSetStatus).toHaveBeenCalledWith("uploading"),
      );

      expect(mockUploadSegment).toHaveBeenCalled();
      expect(mockSetStatus).toHaveBeenCalledWith("paused");
      expect(notifications.sendNotification).toHaveBeenCalledWith(
        "Recording Paused",
        expect.any(String),
      );
    });
  });
});
