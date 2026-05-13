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
import { createContext, useRef } from "react";

import { getPersonType, Person } from "~@meetings/app/common/types";
import { useDiscardMeeting } from "~@meetings/app/hooks/useDiscardMeeting";
import { useEndMeeting } from "~@meetings/app/hooks/useEndMeeting";
import { useUploadSegment } from "~@meetings/app/shared/api";
import { extractError } from "~@meetings/app/shared/lib/extractError";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { AUDIO_FORMATS } from "~@meetings/config";

import { MeetingModal } from "../ui/MeetingModal";
import { useRecordingStore, useRecordingStoreHydrated } from "./store";
import { RecordingProviderProps, RecordingWeb } from "./types";
import { useWebAudioRecorder } from "./useAudioRecorder.web";
import { useDurationTimer } from "./useDurationTimer";
import { useInitialization } from "./useInitialization.web";

export const RecordingContext = createContext<RecordingWeb | null>(null);

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const uploadSegment = useUploadSegment();

  const {
    status,
    note,
    meetingId,
    person,
    isRecordingViewMinimized,
    durationMs: persistedDurationMs,
    setStatus,
    setNote,
    setMeetingId,
    setPerson,
    setIsRecordingViewMinimized,
    setDurationMs: setPersistedDurationMs,
  } = useRecordingStore();

  const timer = useDurationTimer();
  const { isOnline } = useIsOnline();
  const pendingOfflineBlobRef = useRef<Blob | null>(null);

  const hasHydrated = useRecordingStoreHydrated();

  useInitialization({
    status,
    hasHydrated,
    persistedDurationMs,
    meetingId,
    setStatus,
    setInitialDuration: timer.setInitialDurationMs,
    setPersistedDurationMs,
  });

  const isRecording = status && status === "recording";
  const isPaused =
    status && ["paused", "stopping", "discarding"].includes(status);

  const recorder = useWebAudioRecorder({
    onStop: () => setStatus("paused"),
    onError: (err: Error) => {
      console.error(err);
      window.alert("Recording error occurred");
      const duration = timer.stop();
      if (duration) setPersistedDurationMs(duration);
    },
  });

  const openRecordingView = ({
    meetingId,
    person,
  }: {
    meetingId: string;
    person: Person;
  }) => {
    setMeetingId(meetingId);
    setPerson(person);
  };

  const closeRecordingView = () => {
    setMeetingId(null);
    setPerson(null);
    setIsRecordingViewMinimized(false);
  };

  const startRecording = async () => {
    Sentry.setTag("meetingId", meetingId);
    try {
      await recorder.start();
      timer.start();
      setStatus("recording");
      Sentry.logger.info("recording.start", { meetingId, status: "recording" });
    } catch (err) {
      const errorMessage = extractError(err);
      Sentry.logger.error("recording.start.error", {
        meetingId,
        error: errorMessage,
      });
      console.error(errorMessage);
      alert(errorMessage);
    }
  };

  const stopAndUploadRecording = async (): Promise<Blob | null> => {
    if (!meetingId) {
      Sentry.logger.error("upload.segment.error", {
        meetingId,
        error: "meetingId is required for uploading",
      });
      throw new Error("meetingId is required for uploading");
    }

    try {
      const blob = await recorder.stop();

      if (!blob) {
        return null;
      }

      if (!isOnline) {
        return blob;
      }

      const uriToUpload = URL.createObjectURL(blob);

      Sentry.logger.info("upload.segment.start", { meetingId });

      await uploadSegment({
        uri: uriToUpload,
        meetingId,
        contentType: AUDIO_FORMATS.webm.contentType,
        fileExtension: AUDIO_FORMATS.webm.extension,
      });

      Sentry.logger.info("upload.segment.done", {
        meetingId,
        bytes: blob.size,
      });

      await recorder.cleanup();
      URL.revokeObjectURL(uriToUpload);
      return null;
    } catch (err) {
      const errorMessage = extractError(err);
      Sentry.logger.error("upload.segment.error", {
        meetingId,
        error: errorMessage,
      });
      setStatus("paused");
      console.error(errorMessage);
      alert(errorMessage);
      throw err;
    }
  };

  const togglePauseResume = async () => {
    if (status === "uploading") {
      return;
    }

    if (isPaused) {
      Sentry.logger.info("recording.pause", { meetingId });
      await resumeRecording();
      Sentry.logger.info("recording.resume", { meetingId });
      return;
    }

    if (isRecording) {
      Sentry.logger.info("recording.resume", { meetingId });
      await pauseRecording();
      Sentry.logger.info("recording.pause", { meetingId });
      setStatus("paused");
    }
  };

  const cleanupRecording = async () => {
    await recorder.cleanup();
    timer.reset();
    setPersistedDurationMs(0);
    setStatus("idle");
    setNote("");
  };

  const pauseRecording = async () => {
    setStatus("uploading");

    const duration = timer.stop();
    if (duration) setPersistedDurationMs(duration);

    const blob = await stopAndUploadRecording();
    if (blob) {
      pendingOfflineBlobRef.current = blob;
    }
  };

  const resumeRecording = async () => {
    await stopAndUploadRecording(); // we need only uploading, the recording is already paused
    await startRecording();
  };

  const stopRecording = async () => {
    if (isRecording) {
      await pauseRecording();
    }
    setStatus("stopping");
  };

  const discardRecording = async () => {
    if (isRecording) {
      await pauseRecording();
    }
    setStatus("discarding");
  };

  const { mutateAsync: endMeeting } = useEndMeeting();
  const { mutateAsync: discardMeeting } = useDiscardMeeting();

  const handleFinishAndSave = async () => {
    if (!meetingId || !person) {
      Sentry.logger.error("meeting.end.error", {
        meetingId,
        error: "Cannot end meeting without a meeting ID and person",
      });
      throw new Error("Cannot end meeting without a meeting ID and person");
    }

    setStatus("ending");

    try {
      let audioBlob: Blob | undefined;
      if (recorder.isRecording) {
        const blob = await stopAndUploadRecording();
        if (blob) audioBlob = blob;
      } else {
        audioBlob = pendingOfflineBlobRef.current ?? undefined;
        pendingOfflineBlobRef.current = null;
      }

      const userNotepadNotes = note;
      await endMeeting({
        meetingId,
        userNotepadNotes,
        personId: person.personId,
        personType: getPersonType(person),
        audioBlob,
        endTime: new Date(),
        person,
      });
      Sentry.logger.info("meeting.end", { meetingId });
      await cleanupRecording();
      Sentry.setTag("meetingId", null);
      closeRecordingView();
    } catch (err) {
      const errorMessage = extractError(err);
      Sentry.logger.error("meeting.end.error", {
        meetingId,
        error: errorMessage,
      });
      console.error("Failed to end meeting:", errorMessage);
      alert("Failed to end meeting. Please try again.");
      setStatus("idle");
    }
  };

  const handleFinalDiscard = async () => {
    if (!meetingId || !person) {
      Sentry.logger.error("meeting.discard.error", {
        meetingId,
        error: "Cannot discard meeting without a meeting ID and person",
      });
      throw new Error("Cannot discard meeting without a meeting ID and person");
    }

    try {
      await cleanupRecording();
      closeRecordingView();
      await discardMeeting({
        meetingId,
        personId: person.personId,
        personType: getPersonType(person),
      });
      Sentry.logger.info("meeting.discard", { meetingId });
      Sentry.setTag("meetingId", null);
    } catch (err) {
      const errorMessage = extractError(err);
      Sentry.logger.error("meeting.discard.error", {
        meetingId,
        error: errorMessage,
      });
      console.error("Failed to end meeting:", errorMessage);
      alert("Failed to discard meeting. Please try again.");
      throw err;
    }
  };

  return (
    <RecordingContext.Provider
      value={{
        status,
        setStatus,
        isRecordingViewMinimized,
        setIsRecordingViewMinimized,
        meetingId,
        person,
        openRecordingView,
        closeRecordingView,
        isRecording: recorder.isRecording,
        durationMs: timer.durationMs,
        isSpeaking: recorder.isSpeaking,
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
      <MeetingModal />
    </RecordingContext.Provider>
  );
};
