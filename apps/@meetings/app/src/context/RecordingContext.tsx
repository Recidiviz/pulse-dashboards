// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

import { RecordingStatus } from "../common/types";
import {
  getRecordingState,
  getRecordingUri,
  removeRecordingUri,
  saveRecordingUri,
  setRecordingState,
} from "../utils/storage";

interface RecordingContextType {
  // runtimeStatus: in-memory status that updates UI
  status: RecordingStatus;

  // Updates both runtimeStatus AND persistedStatus
  setStatus: (status: RecordingStatus) => void;

  audioRecorder: ReturnType<typeof useAudioRecorder>;
  recorderState: ReturnType<typeof useAudioRecorderState>;

  startRecording: () => Promise<void>;
  stopRecording: () => void;
  stopAndUploadRecording: (
    uploadFn: (uri: string) => Promise<void>,
  ) => Promise<void>;

  togglePauseResume: (
    uploadFn: (uri: string) => Promise<void>,
  ) => Promise<void>;

  // Called when app opens or screen mounts
  initializeRecording: () => Promise<void>;

  // Cleanup everything — invoked when user discards or finishes
  cleanupRecording: () => Promise<void>;
}

const MAX_RECORDING_SECONDS = 90 * 60; // 90 minutes

const RecordingContext = createContext<RecordingContextType | undefined>(
  undefined,
);

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  /**
   * runtimeStatus = the UI state machine.
   * This drives the active screen state.
   */
  const [runtimeStatus, setRuntimeStatus] = useState<RecordingStatus>("idle");

  const audioRecorder = useAudioRecorder(RecordingPresets["HIGH_QUALITY"]);
  const recorderState = useAudioRecorderState(audioRecorder);

  /**
   * setStatus()
   * - updates REAL UI state (runtimeStatus)
   * - persists value so app can restore after crash/restart
   */
  const setStatus = async (newStatus: RecordingStatus) => {
    setRuntimeStatus(newStatus);
    await setRecordingState(newStatus); // Persist for future sessions
  };

  /**
   * initializeRecording()
   * - restores persisted state after reload
   * - validates that stored recording file still exists
   */
  const initializeRecording = async () => {
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
          setRuntimeStatus("idle");
          return;
        }
      } else {
        console.warn(
          "Persisted 'recording' state but no URI found -> reset to idle",
        );
        await setRecordingState("idle");
        setRuntimeStatus("idle");
        return;
      }
    }

    // Hydrate UI state from persisted status
    setRuntimeStatus(persistedStatus as RecordingStatus);
  };

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

    await setStatus("recording");
  };

  /**
   * stopRecording()
   * Only updates status — the actual stop happens later in upload.
   */
  const stopRecording = () => {
    setStatus("stopping");
  };

  /**
   * stopAndUploadRecording()
   * Stops recorder, uploads file, removes saved URI.
   */
  const stopAndUploadRecording = async (
    uploadFn: (uri: string) => Promise<void>,
  ) => {
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
        await uploadFn(uri);
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

  /**
   * togglePauseResume()
   * - If paused → resume (start recording)
   * - If recording → pause (upload file)
   */
  const togglePauseResume = async (
    uploadFn: (uri: string) => Promise<void>,
  ) => {
    if (runtimeStatus === "uploading") return;

    if (runtimeStatus === "paused") {
      await startRecording();
    } else if (runtimeStatus === "recording") {
      await setStatus("uploading");
      await stopAndUploadRecording(uploadFn);
      await setStatus("paused");
    }
  };

  /**
   * cleanupRecording()
   * Fully resets app state and removes the file.
   */
  const cleanupRecording = async () => {
    if (recorderState.isRecording) {
      await audioRecorder.stop();
    }
    await removeRecordingUri();
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
        status: runtimeStatus, // exposed to UI
        setStatus,
        audioRecorder,
        recorderState,
        startRecording,
        stopRecording,
        stopAndUploadRecording,
        togglePauseResume,
        initializeRecording,
        cleanupRecording,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
};
