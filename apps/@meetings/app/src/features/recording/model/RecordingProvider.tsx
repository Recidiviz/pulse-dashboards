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
import { createContext, ReactNode, useContext } from "react";

import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";

import { getMicErrorType, MIC_ERROR_MESSAGES } from "../lib/micError";
import { RecorderState } from "./recorderStates";
import { useLeavePageWarning } from "./useLeavePageWarning";
import { useRecorder } from "./useRecorder";

type RecordingContextValue = {
  state: RecorderState;
  audioLevel: number;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  finalizeRecording: () => Promise<string>;
  discardRecording: () => Promise<void>;
  durationMs: number;
};

const RecordingContext = createContext<RecordingContextValue | null>(null);

export function useAudioRecording() {
  const ctx = useContext(RecordingContext);
  if (!ctx) {
    throw new Error(
      "useAudioRecording must be used within <RecordingProvider>",
    );
  }
  return ctx;
}

export function RecordingProvider({ children }: { children: ReactNode }) {
  const recorder = useRecorder();
  const { showSnackbar } = useSnackbar();

  useLeavePageWarning(recorder.state !== "idle");

  const startRecording = async () => {
    try {
      await recorder.start();
      Sentry.logger.info("recording.start");
    } catch (err) {
      const micError = getMicErrorType(err);
      const { title, message } = MIC_ERROR_MESSAGES[micError];
      showSnackbar(`${title}: ${message}`, 6000);
      Sentry.logger.error("recording.start.error", {
        error: String(err),
        micError,
      });
      Sentry.captureException(err);
    }
  };

  const pauseRecording = () => {
    recorder.pause();
    Sentry.logger.info("recording.pause");
  };

  const resumeRecording = () => {
    recorder.resume();
    Sentry.logger.info("recording.resume");
  };

  const finalizeRecording = async (): Promise<string> => {
    try {
      await recorder.stop();
      const url = await recorder.getUrl();
      if (!url) {
        throw new Error(
          "No URL provided when finalizing recording; recorder may never had been started",
        );
      }
      Sentry.logger.info("recording.finalized");
      return url;
    } catch (e) {
      // Intentionally differentiating the two snackbars so a user could potentially
      // tell us which of these errors threw.
      Sentry.logger.error("recording.finalized.exception");
      Sentry.captureException(e);
      showSnackbar("A fatal error occured.");

      throw e;
    }
  };

  const discardRecording = async () => {
    await recorder.discard();
  };

  return (
    <RecordingContext.Provider
      value={{
        state: recorder.state,
        audioLevel: recorder.audioLevel,
        startRecording,
        pauseRecording,
        finalizeRecording,
        discardRecording,
        resumeRecording,
        durationMs: recorder.durationMs,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}
