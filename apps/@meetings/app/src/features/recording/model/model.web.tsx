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

import { createContext, useEffect, useRef } from "react";

import { Person } from "~@meetings/app/common/types";
import { removeItem } from "~@meetings/app/utils/storage";

import { useWebAudioRecorder } from "../hooks/useAudioRecorder.web";
import { useDurationTimer } from "../hooks/useDurationTimer";
import { MeetingModal } from "../ui/MeetingModal";
import { useRecordingStore } from "./store";
import { RecordingProviderProps, RecordingWeb } from "./types";

export const RecordingContext = createContext<RecordingWeb | null>(null);

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const {
    status,
    note,
    meetingId,
    person,
    isRecordingViewMinimized,
    setStatus,
    setNote,
    setMeetingId,
    setPerson,
    setIsRecordingViewMinimized,
  } = useRecordingStore();

  const { duration, startTimer, stopTimer, resetTimer } = useDurationTimer();

  const isRecording = status && status === "recording";
  const isPaused =
    status && ["paused", "stopping", "discarding"].includes(status);

  const recorder = useWebAudioRecorder({
    onStop: () => setStatus("paused"),
    onError: (err: Error) => {
      console.error(err);
      window.alert("Recording error occurred");
      stopTimer();
    },
  });

  // -- Initialization --
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!status || isInitialized.current) return;
    if (!(status === "idle" || status === "paused")) {
      setStatus("paused");
    }
    isInitialized.current = true;
  }, [status, setStatus]);

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
      startTimer();
      setStatus("recording");
    } catch (err) {
      console.error(err);
      alert(err);
    }
  };

  const stopAndUploadRecording = async (
    uploadFn: (uri: string) => Promise<void>,
  ) => {
    try {
      const blob = await recorder.stop();
      let uriToUpload: string | null = null;

      if (blob) {
        uriToUpload = URL.createObjectURL(blob);
      } else {
        return console.warn("No recording found to upload");
      }

      await uploadFn(uriToUpload);

      await recorder.cleanup();
      URL.revokeObjectURL(uriToUpload);
    } catch (err) {
      setStatus("paused");
      throw err;
    }
  };

  const togglePauseResume = async (
    uploadFn: (uri: string) => Promise<void>,
  ) => {
    if (status === "uploading") {
      return;
    }

    if (isPaused) {
      await resumeRecording(uploadFn);
      return;
    }

    if (isRecording) {
      await pauseRecording(uploadFn);
      setStatus("paused");
    }
  };

  const cleanupRecording = async () => {
    await recorder.cleanup();
    resetTimer();

    await removeItem("durationMs");
    await setStatus("idle");
    setNote("");
  };

  const pauseRecording = async (uploadFn: (uri: string) => Promise<void>) => {
    setStatus("uploading");
    await stopAndUploadRecording(uploadFn);
    stopTimer();
  };

  const resumeRecording = async (uploadFn: (uri: string) => Promise<void>) => {
    await stopAndUploadRecording(uploadFn); // we need only uploading, the recording is already paused
    await startRecording();
  };

  const stopRecording = async (uploadFn: (uri: string) => Promise<void>) => {
    if (isRecording) {
      await pauseRecording(uploadFn);
    }
    setStatus("stopping");
  };

  const discardRecording = async (uploadFn: (uri: string) => Promise<void>) => {
    if (isRecording) {
      await pauseRecording(uploadFn);
    }
    setStatus("discarding");
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
        durationMs: duration,
        note,
        setNote,
        startRecording,
        stopRecording,
        discardRecording,
        stopAndUploadRecording,
        togglePauseResume,
        cleanupRecording,
      }}
    >
      {children}
      <MeetingModal />
    </RecordingContext.Provider>
  );
};
