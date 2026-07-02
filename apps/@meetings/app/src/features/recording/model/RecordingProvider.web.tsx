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
import { createContext, useEffect, useRef } from "react";

import {
  useDiscardMeeting,
  useEndMeeting,
} from "~@meetings/app/entities/meeting";
import { getPersonType } from "~@meetings/app/entities/person";
import { useUserContext } from "~@meetings/app/entities/user";
import { Person, useUploadSegment } from "~@meetings/app/shared/api";
import { env } from "~@meetings/app/shared/config";
import { extractError } from "~@meetings/app/shared/lib/extractError";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { AUDIO_FORMATS } from "~@meetings/config";

import { MeetingModal } from "../ui/MeetingModal";
import { useRecordingStore, useRecordingStoreHydrated } from "./store";
import { RecordingProviderProps, RecordingWeb } from "./types";
import { useWebAudioRecorder } from "./useAudioRecorder.web";
import { useDurationTimer } from "./useDurationTimer";
import { useInitialization } from "./useInitialization.web";

const TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const RecordingContext = createContext<RecordingWeb | null>(null);

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const uploadSegment = useUploadSegment();
  const { mutateAsync: endMeeting } = useEndMeeting();
  const { mutateAsync: discardMeeting } = useDiscardMeeting();
  const { getCredentials, isSkipAuthUser } = useUserContext();

  const {
    status,
    note,
    meetingId,
    meetingType,
    meetingTypeCategory,
    person,
    isRecordingViewMinimized,
    durationMs: persistedDurationMs,
    setStatus,
    setNote,
    setMeetingId,
    setMeetingType,
    setMeetingTypeCategory,
    setPerson,
    setIsRecordingViewMinimized,
    setDurationMs: setPersistedDurationMs,
  } = useRecordingStore();

  const timer = useDurationTimer();
  const { isOnline } = useIsOnline();
  const pendingOfflineBlobRef = useRef<Blob | null>(null);

  const hasHydrated = useRecordingStoreHydrated();

  const isRecording = status && status === "recording";
  const isPaused =
    status && ["paused", "stopping", "discarding"].includes(status);

  // Proactively refresh the Auth0 token while a recording is active so it is
  // always fresh when the user clicks "End Meeting". Auth0 refresh tokens
  // (enabled via useRefreshTokens on Auth0Provider) handle expiry correctly,
  // but this ensures the token is renewed ahead of time rather than lazily on
  // the endMeeting call itself.
  useEffect(() => {
    if (!isRecording || isSkipAuthUser) return;

    const refresh = async () => {
      try {
        await getCredentials(undefined, undefined, {
          audience: env.EXPO_PUBLIC_AUTH0_AUDIENCE,
        });
      } catch (err) {
        Sentry.logger.warn("recording.token_refresh.error", {
          error: extractError(err),
        });
      }
    };

    refresh();
    const interval = setInterval(refresh, TOKEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isRecording, isSkipAuthUser, getCredentials]);

  const recorder = useWebAudioRecorder({
    onStop: () => setStatus("paused"),
    onError: (err: Error) => {
      console.error(err);
      window.alert("Recording error occurred");
      const duration = timer.stop();
      if (duration) setPersistedDurationMs(duration);
      setStatus("paused");
    },
  });

  const openRecordingView = ({
    meetingId,
    person,
    meetingType,
    meetingTypeCategory,
  }: {
    meetingId: string;
    person: Person;
    meetingType: string | null;
    meetingTypeCategory: string | null;
  }) => {
    setMeetingId(meetingId);
    setPerson(person);
    setMeetingType(meetingType);
    setMeetingTypeCategory(meetingTypeCategory);
  };

  const closeRecordingView = () => {
    setMeetingId(null);
    setPerson(null);
    setIsRecordingViewMinimized(false);
  };

  useInitialization({
    status,
    hasHydrated,
    persistedDurationMs,
    meetingId,
    setStatus,
    setInitialDuration: timer.setInitialDurationMs,
    setPersistedDurationMs,
    onError: async (error) => {
      console.error(error);
      Sentry.logger.error("meeting.initialization.error", {
        status,
        meetingId,
        error: extractError(error),
      });
      Sentry.captureException(error, {
        tags: { meetingId },
        extra: { status },
      });

      await cleanupRecording();
      closeRecordingView();

      if (meetingId && person) {
        try {
          await endMeeting({
            meetingId,
            personId: person.personId,
            personType: getPersonType(person),
          });
          alert(
            `Your meeting with ${person.fullName} ended due to a recording issue`,
          );
          Sentry.logger.info("meeting.end", { meetingId });
        } catch (error) {
          Sentry.logger.error("meeting.end.error", {
            meetingId,
            error: extractError(error),
          });
          Sentry.captureException(error, { tags: { meetingId } });
        }
      }
    },
  });

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
      Sentry.captureException(err, { tags: { meetingId } });
      console.error(errorMessage);
      setStatus("paused");
      alert(errorMessage);
    }
  };

  const uploadRecording = async (blob: Blob | null) => {
    if (!blob) return;

    if (!meetingId) {
      const error = new Error("meetingId is required for uploading");
      Sentry.logger.error("upload.segment.error", {
        meetingId,
        error: error.message,
      });
      Sentry.captureException(error);
      throw error;
    }

    const uriToUpload = URL.createObjectURL(blob);

    Sentry.logger.info("upload.segment.start", { meetingId });

    try {
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
    } catch (err) {
      const errorMessage = extractError(err);
      Sentry.logger.error("upload.segment.error", {
        meetingId,
        error: errorMessage,
      });
      Sentry.captureException(err, { tags: { meetingId } });
      setStatus("paused");
      console.error(errorMessage);
      alert(errorMessage);
      throw err;
    } finally {
      URL.revokeObjectURL(uriToUpload);
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
    setMeetingType(null);
    setMeetingTypeCategory(null);
  };

  const pauseRecording = async () => {
    setStatus("uploading");

    const duration = timer.stop();
    if (duration) setPersistedDurationMs(duration);

    const blob = await recorder.stop();
    if (blob && isOnline) {
      await uploadRecording(blob);
    } else if (blob) {
      pendingOfflineBlobRef.current = blob;
    }
  };

  const resumeRecording = async () => {
    const blob = await recorder.stop();
    if (blob && isOnline) {
      await uploadRecording(blob);
    } else if (blob) {
      pendingOfflineBlobRef.current = blob;
    }
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

  const handleFinishAndSave = async () => {
    if (!meetingId || !person) {
      const error = new Error(
        "Cannot end meeting without a meeting ID and person",
      );
      Sentry.logger.error("meeting.end.error", {
        meetingId,
        error: error.message,
      });
      Sentry.captureException(error, { tags: { meetingId } });
      throw error;
    }

    setStatus("ending");

    try {
      let audioBlob: Blob | undefined;
      if (recorder.isRecording) {
        const blob = await recorder.stop();
        if (blob && isOnline) {
          await uploadRecording(blob);
        } else if (blob) {
          audioBlob = blob;
        }
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
      Sentry.captureException(err, { tags: { meetingId } });
      console.error("Failed to end meeting:", errorMessage);
      alert("Failed to end meeting. Please try again.");
      setStatus("paused");
    }
  };

  const handleFinalDiscard = async () => {
    if (!meetingId || !person) {
      const error = new Error(
        "Cannot discard meeting without a meeting ID and person",
      );
      Sentry.logger.error("meeting.discard.error", {
        meetingId,
        error: error.message,
      });
      Sentry.captureException(error, { tags: { meetingId } });
      throw error;
    }

    try {
      await discardMeeting({
        meetingId,
        personId: person.personId,
        personType: getPersonType(person),
      });
      await cleanupRecording();
      closeRecordingView();
      Sentry.logger.info("meeting.discard", { meetingId });
      Sentry.setTag("meetingId", null);
    } catch (err) {
      const errorMessage = extractError(err);
      Sentry.logger.error("meeting.discard.error", {
        meetingId,
        error: errorMessage,
      });
      Sentry.captureException(err, { tags: { meetingId } });
      console.error("Failed to end meeting:", errorMessage);
      alert("Failed to discard meeting. Please try again.");
      setStatus("paused");
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
        meetingType,
        meetingTypeCategory,
        person,
        openRecordingView,
        closeRecordingView,
        isRecording: recorder.isRecording,
        durationMs: timer.durationMs,
        audioLevel: recorder.audioLevel,
        note,
        setNote,
        hasHydrated,
        startRecording,
        stopRecording,
        discardRecording,
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
