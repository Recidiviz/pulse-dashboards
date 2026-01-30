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

import { useCallback, useRef, useState } from "react";

import { MAX_RECORDING_MS, WEB_CHUNK_INTERVAL_MS } from "../constants";
import {
  clearRecordedChunks,
  getAllChunksAndCreateBlob,
  saveChunk,
} from "../utils/webRecorderDb.web";

type Params = {
  onStop: () => void;
  onError: (err: Error) => void;
};

export const useWebAudioRecorder = ({ onStop, onError }: Params) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStopTimerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const stop = useCallback(async (): Promise<Blob | null> => {
    // Clear auto-stop timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    setIsRecording(false);

    // Stop MediaRecorder and Stream
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      await new Promise<void>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const recorder = mediaRecorderRef.current!;

        const handleStop = () => {
          // Stop all audio tracks to release microphone
          streamRef.current?.getTracks().forEach((track) => track.stop());
          resolve();
        };

        // If for some reason onstop doesn't fire, we resolve anyway after a timeout
        const safetyTimeout = setTimeout(handleStop, 1000);

        recorder.onstop = () => {
          clearTimeout(safetyTimeout);
          handleStop();
        };

        recorder.stop();
      });
    }

    const blob = await getAllChunksAndCreateBlob();
    return blob;
  }, []);

  const start = useCallback(async () => {
    if (typeof MediaRecorder === "undefined") {
      throw new Error("Your browser does not support recording audio");
    }

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 44100,
        channelCount: 2,
      },
    });
    streamRef.current = stream;

    // Create MediaRecorder for the stream
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 128000,
    });
    mediaRecorderRef.current = mediaRecorder;

    // Save each audio chunk as it becomes available, every WEB_CHUNK_INTERVAL_MS
    mediaRecorder.ondataavailable = async (event) => {
      if (event.data && event.data.size > 0) {
        await saveChunk(event.data);
      }
    };

    mediaRecorder.onerror = (event) => {
      onError(new Error(event.error?.message || "Recorder error"));
      stop();
    };

    mediaRecorder.start(WEB_CHUNK_INTERVAL_MS);
    setIsRecording(true);

    // Auto-stop limit
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    autoStopTimerRef.current = window.setTimeout(() => {
      stop();
      onStop();
    }, MAX_RECORDING_MS);
  }, [onError, onStop, stop]);

  const cleanup = useCallback(async () => {
    await stop();
    await clearRecordedChunks();
  }, [stop]);

  return { start, stop, cleanup, isRecording };
};
