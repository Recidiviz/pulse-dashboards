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

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

import { useDurationTimer } from "../hooks/useDurationTimer";
import { useNote } from "../hooks/useNote";
import { usePersistedFileDuration } from "../hooks/usePersistedFileDuration.native";
import { useRecordingStatus } from "../hooks/useRecordingStatus";
import { useUploadSegment } from "../hooks/useUploadSegment";
import { requestNotificationPermissions } from "../utils/notifications";
import {
  getRecordingState,
  getRecordingUri,
  removeRecordingUri,
  saveRecordingUri,
  setRecordingState,
} from "../utils/storage";
import { useRecordingStore, useRecordingStoreHydrated } from "./store";
import { RecordingNative, RecordingProviderProps, Status } from "./types";

const MAX_RECORDING_SECONDS = 90 * 60; // 90 minutes

export const RecordingContext = createContext<RecordingNative | null>(null);

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const uploadSegment = useUploadSegment();

  /**
   * status = the UI state machine.
   * This drives the active screen state.
   */
  const [status, setStatus] = useRecordingStatus();
  const [note, setNote] = useNote();
  const audioRecorder = useAudioRecorder(RecordingPresets["HIGH_QUALITY"]);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [persistedRecordingUri, setPersistedRecordingUri] = useState<
    string | null
  >(null);

  const {
    meetingId,
    setMeetingId,
    durationMs: persistedDurationMs,
    setDurationMs: setPersistedDurationMs,
  } = useRecordingStore();

  const hasHydrated = useRecordingStoreHydrated();

  const { durationMs: persistedFileDurationMs } = usePersistedFileDuration(
    persistedRecordingUri,
  );

  const timer = useDurationTimer();

  const isTimerInitialized = useRef(false);
  useEffect(() => {
    if (persistedFileDurationMs && !isTimerInitialized.current) {
      timer.setInitialDurationMs(persistedFileDurationMs + persistedDurationMs);
      setPersistedDurationMs(persistedFileDurationMs + persistedDurationMs);
      isTimerInitialized.current = true;
    }
  }, [
    persistedFileDurationMs,
    timer,
    persistedDurationMs,
    setPersistedDurationMs,
  ]);

  /**
   * initializeRecording()
   * - restores persisted state after reload
   * - validates that stored recording file still exists
   */
  const initializeRecording = useCallback(async () => {
    const permissionStatus =
      await AudioModule.requestRecordingPermissionsAsync();
    if (!permissionStatus.granted) {
      Alert.alert("Permission to access microphone was denied");
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      shouldPlayInBackground: true,
    });

    /**
     * persistedStatus = final saved state from last session
     * Example: "recording" if app crashed during recording.
     */
    const persistedStatus = await getRecordingState();

    // If persisted state says “recording”, ensure file still exists
    if (persistedStatus === "recording") {
      const savedUri = await getRecordingUri();

      if (savedUri) {
        const fileInfo = await FileSystem.getInfoAsync(savedUri);

        if (!fileInfo.exists) {
          console.warn(
            "Persisted recording state found but file missing -> reset to idle",
          );
          await setRecordingState("idle");
          await removeRecordingUri();
          setStatus("idle");
          return;
        }
      } else {
        console.warn(
          "Persisted 'recording' state but no URI found -> reset to idle",
        );
        await setRecordingState("idle");
        setStatus("idle");
        return;
      }
    }

    // Hydrate UI state from persisted status
    setStatus(persistedStatus as Status);
  }, [setStatus]);

  // Initialize recording + restore previous state on provider mount (once per app session)
  const isInitialized = useRef(false);
  useEffect(() => {
    if (isInitialized.current) return;

    (async () => {
      // TODO: recordingUri is fetched separately from AsyncStorage via getRecordingUri(),
      // but the Zustand store already persists to AsyncStorage via the `persist` middleware.
      // We should add a `recordingUri` field to RecordingStore so it's persisted automatically
      // alongside the other fields, and remove the manual getRecordingUri/saveRecordingUri calls.
      const persistedUri = await getRecordingUri();
      setPersistedRecordingUri(persistedUri);
      await initializeRecording();
      requestNotificationPermissions();
    })();
    isInitialized.current = true;
  }, [initializeRecording]);

  /**
   * startRecording()
   * Starts fresh recording and persists the URI immediately.
   */
  const startRecording = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record({ forDuration: MAX_RECORDING_SECONDS });
    if (audioRecorder.uri) {
      await saveRecordingUri(audioRecorder.uri);
    }

    timer.start();
    await setStatus("recording");
  };

  /**
   * stopAndUploadRecording()
   * Stops recorder, uploads file, removes saved URI.
   */
  const stopAndUploadRecording = async () => {
    if (!meetingId) throw new Error("meetingId is required for uploading");

    try {
      const savedUri = await getRecordingUri();
      let uri = savedUri || audioRecorder.uri;

      // Stop active recording first
      if (recorderState.isRecording) {
        await audioRecorder.stop();
        // Fallback to previously saved URI in case audioRecorder.uri isn't set immediately after stopping
        uri = audioRecorder.uri || uri;

        if (audioRecorder.uri) {
          await saveRecordingUri(audioRecorder.uri);
        }
      }

      if (uri) {
        await uploadSegment({ uri, meetingId });
        await removeRecordingUri();
      } else {
        console.warn("No recording URI found; nothing to upload.");
        await removeRecordingUri();
      }
    } catch (err) {
      console.error("Upload failed:", err);
      Alert.alert("Upload Recording Failed");
      await setStatus("paused"); // fallback safe state
      throw err;
    }
  };

  const stopRecording = async () => {
    await togglePauseResume();
    setStatus("stopping");
  };

  const discardRecording = async () => {
    await togglePauseResume();
    setStatus("discarding");
  };

  /**
   * togglePauseResume()
   * - If paused → resume (start recording)
   * - If recording → pause (upload file)
   */
  const togglePauseResume = async () => {
    if (status === "uploading") return;

    if (status && ["paused", "stopping", "discarding"].includes(status)) {
      await startRecording();
    } else if (status === "recording") {
      const duration = timer.stop();
      if (duration) setPersistedDurationMs(duration);
      await setStatus("uploading");
      await stopAndUploadRecording();
      await setStatus("paused");
    }
  };

  /**
   * cleanupRecording()
   * Fully resets app state and removes the file.
   */
  const cleanupRecording = async () => {
    await removeRecordingUri();
    timer.reset();
    setPersistedDurationMs(0);
    await setStatus("idle");
  };

  /**
   * Persist URI during active recording.
   */
  useEffect(() => {
    if (recorderState.isRecording && audioRecorder.uri) {
      saveRecordingUri(audioRecorder.uri);
    }
  }, [recorderState.isRecording, audioRecorder.uri]);

  return (
    <RecordingContext.Provider
      value={{
        status: status || "idle",
        setStatus,
        setMeetingId,
        isRecording: recorderState.isRecording,
        durationMs: timer.durationMs,
        note,
        setNote,
        hasHydrated,
        startRecording,
        stopRecording,
        discardRecording,
        stopAndUploadRecording,
        togglePauseResume,
        cleanupRecording,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};
