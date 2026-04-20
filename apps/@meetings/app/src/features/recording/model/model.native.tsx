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

import { getPersonType } from "~@meetings/app/common/types";
import { useUploadSegment } from "~@meetings/app/entities/upload-segment";
import { useDiscardMeeting } from "~@meetings/app/hooks/useDiscardMeeting";
import { useEndMeeting } from "~@meetings/app/hooks/useEndMeeting";
import useIsOnline from "~@meetings/app/hooks/useIsOnline";
import { useUpdateNotes } from "~@meetings/app/hooks/useUpdateNotesMutation";
import { AUDIO_FORMATS } from "~@meetings/config";

import { useDurationTimer } from "../hooks/useDurationTimer";
import { useNote } from "../hooks/useNote";
import { usePersistedFileDuration } from "../hooks/usePersistedFileDuration.native";
import { useRecordingStatus } from "../hooks/useRecordingStatus";
import { MeetingModalMobile } from "../ui/MeetingModalMobile";
import {
  requestNotificationPermissions,
  sendNotification,
} from "../utils/notifications";
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
    person,
    personType,
    setPerson,
    setPersonType,
    durationMs: persistedDurationMs,
    setDurationMs: setPersistedDurationMs,
  } = useRecordingStore();
  const { isOnline } = useIsOnline();
  const { mutateAsync: endMeeting } = useEndMeeting();
  const { mutateAsync: discardMeeting } = useDiscardMeeting();
  const updateNotesMutation = useUpdateNotes();
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
        await uploadSegment({
          uri,
          meetingId,
          contentType: AUDIO_FORMATS.m4a.contentType,
          fileExtension: AUDIO_FORMATS.m4a.extension,
        });
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
    return null;
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
   * - If recording → pause (sync notes to server, upload file)
   */
  const togglePauseResume = async () => {
    if (status === "uploading" || !meetingId) return;

    if (status && ["paused", "stopping", "discarding"].includes(status)) {
      await startRecording();
    } else if (status === "recording") {
      // Sync notes to server when pausing
      updateNotesMutation.mutate(
        {
          meetingId,
          userNotepadNotes: note,
        },
        {
          onError: (err) => console.error("Failed to update notes:", err),
        },
      );

      const duration = timer.stop();
      if (duration) setPersistedDurationMs(duration);

      if (!isOnline) {
        // Offline: stop the recorder and save the URI locally; skip upload
        if (recorderState.isRecording) {
          await audioRecorder.stop();
          const uri = audioRecorder.uri;
          if (uri) {
            await saveRecordingUri(uri);
            setPersistedRecordingUri(uri);
          }
        }
        await setStatus("paused");
        return;
      }

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
    setNote("");
    await setStatus("idle");
  };

  const handleFinishAndSave = async (onComplete?: () => void) => {
    if (!meetingId || !person) {
      throw new Error("Cannot end meeting without a meeting ID and person");
    }

    setStatus("ending");

    try {
      if (recorderState.isRecording) {
        await stopAndUploadRecording();
      }

      const userNotepadNotes = note;
      setNote("");
      const audioUri = persistedRecordingUri ?? audioRecorder.uri ?? undefined;
      await endMeeting({
        meetingId,
        userNotepadNotes,
        personId: person.personId,
        personType: getPersonType(person),
        audioUri,
        endTime: new Date(),
        person,
      });
      await cleanupRecording();
      onComplete?.();
    } catch (err) {
      console.error("Failed to end meeting:", err);
      Alert.alert("Error", "Failed to end meeting. Please try again.");
      setStatus("idle");
    }
  };

  const handleFinalDiscard = async (onComplete?: () => void) => {
    if (!meetingId || !person)
      throw new Error("Cannot discard meeting without a meeting ID and person");

    await cleanupRecording();
    onComplete?.();
    await discardMeeting({
      meetingId,
      personId: person.personId,
      personType: getPersonType(person),
    });
  };

  // Auto-stop recording when 90-minute limit is reached
  const prevRecorderStateRef = useRef(recorderState.isRecording);
  useEffect(() => {
    const prevIsRecording = prevRecorderStateRef.current;

    if (
      status === "recording" &&
      prevIsRecording &&
      !recorderState.isRecording
    ) {
      (async () => {
        setStatus("uploading");
        await stopAndUploadRecording();
        setStatus("paused");
        sendNotification(
          "Recording Paused",
          "90 minute-at-a-time recording limit reached. Pausing Recording",
        );
      })();
    }

    if (status !== "stopping") {
      prevRecorderStateRef.current = recorderState.isRecording;
    }
    // stopAndUploadRecording causes infinite loop if included
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, recorderState.isRecording]);

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
        meetingId,
        setMeetingId,
        person,
        personType,
        setPerson,
        setPersonType,
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
        handleFinishAndSave,
        handleFinalDiscard,
      }}
    >
      {children}
      <MeetingModalMobile />
    </RecordingContext.Provider>
  );
};
