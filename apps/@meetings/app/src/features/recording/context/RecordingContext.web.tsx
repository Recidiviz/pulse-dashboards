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

import { createContext, ReactNode, useEffect, useRef } from "react";

import { removeItem } from "~@meetings/app/utils/storage";

import { useWebAudioRecorder } from "../hooks/useAudioRecorder.web";
import { useDurationTimer } from "../hooks/useDurationTimer";
import { useNote } from "../hooks/useNote";
import { useRecordingStatus } from "../hooks/useRecordingStatus";
import { Recording } from "../types";

export const RecordingContext = createContext<Recording>({} as Recording);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useRecordingStatus();
  const [note, setNote] = useNote();

  const { duration, startTimer, stopTimer, resetTimer } = useDurationTimer();

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

    if (status && ["paused", "stopping", "discarding"].includes(status)) {
      await stopAndUploadRecording(uploadFn); // we need only uploading, the recording is already paused
      await startRecording();
      return;
    }

    if (status === "recording") {
      setStatus("uploading");
      await stopAndUploadRecording(uploadFn); // we need only stopping, we upload audio above
      stopTimer();
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

  const stopRecording = async (uploadFn: (uri: string) => Promise<void>) => {
    await togglePauseResume(uploadFn);
    setStatus("stopping");
  };

  const discardRecording = async (uploadFn: (uri: string) => Promise<void>) => {
    await togglePauseResume(uploadFn);
    setStatus("discarding");
  };

  return (
    <RecordingContext.Provider
      value={{
        status,
        setStatus,
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
    </RecordingContext.Provider>
  );
};
