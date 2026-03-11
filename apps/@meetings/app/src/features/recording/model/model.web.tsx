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

import { createContext } from "react";

import { Person } from "../../../common/types";
import { useWebAudioRecorder } from "../hooks/useAudioRecorder.web";
import { useDiscardMeeting } from "../hooks/useDiscardMeeting";
import { useDurationTimer } from "../hooks/useDurationTimer";
import { useEndMeeting } from "../hooks/useEndMeeting";
import { useInitialization } from "../hooks/useInitialization.web";
import { useUploadSegment } from "../hooks/useUploadSegment";
import { MeetingModal } from "../ui/MeetingModal";
import { useRecordingStore, useRecordingStoreHydrated } from "./store";
import { RecordingProviderProps, RecordingWeb } from "./types";

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
    try {
      await recorder.start();
      timer.start();
      setStatus("recording");
    } catch (err) {
      console.error(err);
      alert(err);
    }
  };

  const stopAndUploadRecording = async () => {
    if (!meetingId) throw new Error("meetingId is required for uploading");

    try {
      const blob = await recorder.stop();
      let uriToUpload: string | null = null;

      if (blob) {
        uriToUpload = URL.createObjectURL(blob);
      } else {
        return console.warn("No recording found to upload");
      }

      await uploadSegment({ uri: uriToUpload, meetingId });

      await recorder.cleanup();
      URL.revokeObjectURL(uriToUpload);
    } catch (err) {
      setStatus("paused");
      throw err;
    }
  };

  const togglePauseResume = async () => {
    if (status === "uploading") {
      return;
    }

    if (isPaused) {
      await resumeRecording();
      return;
    }

    if (isRecording) {
      await pauseRecording();
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
    await stopAndUploadRecording();
    const duration = timer.stop();
    if (duration) setPersistedDurationMs(duration);
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
      throw new Error("Cannot end meeting without a meeting ID and person");
    }

    setStatus("ending");

    try {
      if (recorder.isRecording) {
        await stopAndUploadRecording();
      }

      const userNotepadNotes = note;
      await endMeeting({
        meetingId,
        userNotepadNotes,
        personId: person.personId,
      });
      await cleanupRecording();
      closeRecordingView();
    } catch (err) {
      console.error("Failed to end meeting:", err);
      window.alert("Failed to end meeting. Please try again.");
      setStatus("idle");
    }
  };

  const handleFinalDiscard = async () => {
    if (!meetingId || !person) {
      throw new Error("Cannot discard meeting without a meeting ID and person");
    }

    await cleanupRecording();
    await discardMeeting({ meetingId, personId: person.personId });
    closeRecordingView();
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
