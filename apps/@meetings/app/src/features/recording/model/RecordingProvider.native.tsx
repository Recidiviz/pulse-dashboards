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

import { getPersonType } from "~@meetings/app/entities/person";
import { useDiscardMeeting } from "~@meetings/app/hooks/useDiscardMeeting";
import { useEndMeeting } from "~@meetings/app/hooks/useEndMeeting";
import { useUpdateNotes } from "~@meetings/app/hooks/useUpdateNotesMutation";
import { useUploadSegment } from "~@meetings/app/shared/api";
import { extractError } from "~@meetings/app/shared/lib/extractError";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { AUDIO_FORMATS } from "~@meetings/config";

import { AUDIO_LEVEL_INTERVAL_MS } from "../config";
import { dbToAudioLevel } from "../lib/audioLevel";
import {
  requestNotificationPermissions,
  sendNotification,
} from "../lib/notifications";
import {
  getRecordingState,
  getRecordingUri,
  removeRecordingUri,
  saveRecordingUri,
  setRecordingState,
} from "../lib/storage";
import { MeetingModalMobile } from "../ui/MeetingModalMobile";
import { useRecordingStore, useRecordingStoreHydrated } from "./store";
import { RecordingNative, RecordingProviderProps, Status } from "./types";
import { useDurationTimer } from "./useDurationTimer";
import { useNote } from "./useNote";
import { usePersistedFileDuration } from "./usePersistedFileDuration.native";
import { useRecordingStatus } from "./useRecordingStatus";

const MAX_RECORDING_SECONDS = 90 * 60; // 90 minutes

export const RecordingContext = createContext<RecordingNative | null>(null);

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const uploadSegment = useUploadSegment();

  /**
   * status = the UI state machine.
   * This drives the active screen state.
   */
  const [status, setStatus] = useRecordingStatus();
  // Keep the latest status available to stable callbacks (e.g. recoverFromStuckState)
  // without making it a dependency that re-creates them on every status change.
  const statusRef = useRef(status);
  statusRef.current = status;
  const [note, setNote] = useNote();
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets["HIGH_QUALITY"],
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(
    audioRecorder,
    AUDIO_LEVEL_INTERVAL_MS,
  );

  // Normalized 0–1 loudness on the same scale as web. metering is dBFS.
  const audioLevel = recorderState.isRecording
    ? dbToAudioLevel(recorderState.metering ?? -Infinity)
    : 0;

  const [persistedRecordingUri, setPersistedRecordingUri] = useState<
    string | null
  >(null);

  const {
    meetingId,
    meetingType,
    meetingTypeCategory,
    setMeetingId,
    setMeetingType,
    setMeetingTypeCategory,
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
   * cleanupRecording()
   * Fully resets app state and removes the file.
   */
  const cleanupRecording = useCallback(async () => {
    await removeRecordingUri();
    timer.reset();
    setPersistedDurationMs(0);
    setNote("");
    await setStatus("idle");
    setMeetingType(null);
    setMeetingTypeCategory(null);
  }, [
    timer,
    setPersistedDurationMs,
    setNote,
    setStatus,
    setMeetingType,
    setMeetingTypeCategory,
  ]);

  /**
   * stopAndUploadRecording()
   * Stops recorder, uploads file, removes saved URI.
   */
  const stopAndUploadRecording = useCallback(async () => {
    if (!meetingId) {
      Sentry.logger.error("upload.segment.error", {
        meetingId,
        error: "meetingId is required for uploading",
      });
      throw new Error("meetingId is required for uploading");
    }

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
        Sentry.logger.info("upload.segment.start", { meetingId });

        await uploadSegment({
          uri,
          meetingId,
          contentType: AUDIO_FORMATS.m4a.contentType,
          fileExtension: AUDIO_FORMATS.m4a.extension,
        });

        const fileInfo = await FileSystem.getInfoAsync(uri);
        const bytes = fileInfo.exists ? fileInfo.size : 0;

        Sentry.logger.info("upload.segment.done", {
          meetingId,
          bytes,
        });

        await removeRecordingUri();
      } else {
        Sentry.logger.warn("upload.segment.no_uri", { meetingId });
        console.warn("No recording URI found; nothing to upload.");
        await removeRecordingUri();
      }
    } catch (err) {
      Sentry.logger.error("upload.segment.error", {
        meetingId,
        error: extractError(err),
      });
      console.error("Upload failed:", err);
      Alert.alert("Upload Recording Failed");
      await setStatus("paused"); // fallback safe state
      throw err;
    }
    return null;
  }, [
    audioRecorder,
    meetingId,
    recorderState.isRecording,
    setStatus,
    uploadSegment,
  ]);

  /**
   * recoverFromStuckState()
   * previous session left the app in a non-idle
   * state without a usable recording file (process killed mid-upload, etc.).
   * Reset local state and discard the backend meeting so the user isn't locked
   * out of the "New Meeting" button across reloads.
   */
  const recoverFromStuckState = useCallback(
    async (reason: string) => {
      console.error(reason);
      Sentry.logger.error("meeting.initialization.error", {
        status: statusRef.current,
        meetingId,
        reason,
      });

      // Attempt to upload whatever audio we have, but don't let a failed upload
      // abort recovery: stopAndUploadRecording re-throws on error, and if we
      // didn't catch it cleanupRecording/endMeeting below would never run and the
      // user would stay locked out of the "New Meeting" button across reloads.
      try {
        await stopAndUploadRecording();
      } catch (err) {
        Sentry.logger.error("upload.segment.error", {
          meetingId,
          error: extractError(err),
        });
      }
      await setRecordingState("idle");
      await cleanupRecording();

      if (meetingId && person) {
        try {
          await endMeeting({
            meetingId,
            personId: person.personId,
            personType: getPersonType(person),
          });
          Alert.alert(
            `Your meeting with ${person.fullName} ended due to a recording issue`,
          );
          Sentry.logger.info("meeting.end", { meetingId });
        } catch (err) {
          Sentry.logger.error("meeting.end.error", {
            meetingId,
            error: extractError(err),
          });
        }
      }

      setMeetingId(null);
      setMeetingType(null);
      setPerson(null);
      setPersonType(null);
    },
    [
      meetingId,
      person,
      endMeeting,
      setMeetingId,
      setMeetingType,
      setPerson,
      setPersonType,
      cleanupRecording,
      stopAndUploadRecording,
    ],
  );

  /**
   * initializeRecording()
   * - restores persisted state after reload
   * - validates that the stored recording file still exists for ANY non-idle
   *   status (not just "recording"), so "uploading"/"paused"/etc. stuck states
   *   recover instead of locking the UI
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

    if (persistedStatus !== "idle") {
      const savedUri = await getRecordingUri();

      if (savedUri) {
        const fileInfo = await FileSystem.getInfoAsync(savedUri);
        const hasUsableFile = fileInfo.exists && fileInfo.size > 0;

        if (!hasUsableFile) {
          await recoverFromStuckState(
            `Persisted "${persistedStatus}" state but no usable recording file found`,
          );
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
  }, [setStatus, recoverFromStuckState]);

  // Initialize recording + restore previous state on provider mount (once per app session)
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!hasHydrated || isInitialized.current) return;

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
  }, [hasHydrated, initializeRecording]);

  /**
   * startRecording()
   * Starts fresh recording and persists the URI immediately.
   */
  const startRecording = async () => {
    Sentry.setTag("meetingId", meetingId);
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record({ forDuration: MAX_RECORDING_SECONDS });
      if (audioRecorder.uri) {
        await saveRecordingUri(audioRecorder.uri);
      }

      timer.start();
      await setStatus("recording");
      Sentry.logger.info("recording.start", { meetingId, status: "recording" });
    } catch (err) {
      const errorMessage = extractError(err);
      Sentry.logger.error("recording.start.error", {
        meetingId,
        error: errorMessage,
      });
      Alert.alert("Recording Start Failed", errorMessage);
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
   * - If recording → pause (sync notes to server, upload file)
   */
  const togglePauseResume = async () => {
    if (status === "uploading" || !meetingId) return;

    if (status && ["paused", "stopping", "discarding"].includes(status)) {
      if (status === "paused") {
        Sentry.logger.info("recording.pause", { meetingId });
      }
      await startRecording();
      Sentry.logger.info("recording.resume", { meetingId });
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

      Sentry.logger.info("recording.resume", { meetingId });

      await stopAndUploadRecording();

      Sentry.logger.info("recording.pause", { meetingId });

      setStatus("paused");

      await setStatus("paused");
    }
  };

  const handleFinishAndSave = async (onComplete?: () => void) => {
    if (!meetingId || !person) {
      Sentry.logger.error("meeting.end.error", {
        meetingId,
        error: "Cannot end meeting without a meeting ID and person",
      });
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
      Sentry.logger.info("meeting.end", { meetingId });
      await cleanupRecording();
      onComplete?.();
      Sentry.setTag("meetingId", null);
    } catch (err) {
      Sentry.logger.error("meeting.end.error", {
        meetingId,
        error: extractError(err),
      });
      console.error("Failed to end meeting:", err);
      Alert.alert("Error", "Failed to end meeting. Please try again.");
      setStatus("paused");
    }
  };

  const handleFinalDiscard = async (onComplete?: () => void) => {
    if (!meetingId || !person) {
      Sentry.logger.error("meeting.discard.error", {
        meetingId,
        error: "Cannot discard meeting without a meeting ID and person",
      });
      throw new Error("Cannot discard meeting without a meeting ID and person");
    }

    try {
      await discardMeeting({
        meetingId,
        personId: person.personId,
        personType: getPersonType(person),
      });
      await cleanupRecording();
      onComplete?.();
      Sentry.logger.info("meeting.discard", { meetingId });
      Sentry.setTag("meetingId", null);
    } catch (err) {
      const errorMessage = extractError(err);
      Sentry.logger.error("meeting.discard.error", {
        meetingId,
        error: errorMessage,
      });
      Alert.alert("Failed to discard meeting", errorMessage);
      setStatus("paused");
      throw err;
    }
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
        meetingType,
        meetingTypeCategory,
        setMeetingId,
        setMeetingType,
        setMeetingTypeCategory,
        person,
        personType,
        setPerson,
        setPersonType,
        isRecording: recorderState.isRecording,
        durationMs: timer.durationMs,
        audioLevel,
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
