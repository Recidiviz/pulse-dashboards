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

import { AUDIO_FORMATS } from "~@meetings/config";

import {
  AUDIO_LEVEL_INTERVAL_MS,
  MAX_RECORDING_MS,
  WEB_CHUNK_INTERVAL_MS,
} from "../config";
import { rmsToAudioLevel } from "../lib/audioLevel";
import {
  clearRecordedChunks,
  getAllChunks,
  saveChunk,
} from "../lib/webRecorderDb.web";

type Params = {
  onStop: () => void;
  onError: (err: Error) => void;
};

export const useWebAudioRecorder = ({ onStop, onError }: Params) => {
  const { contentType } = AUDIO_FORMATS.webm;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStopTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelIntervalRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const stop = useCallback(async (): Promise<Blob | null> => {
    // Clear auto-stop timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    // Clear audio level monitoring
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);

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

    const chunks = await getAllChunks();
    return chunks.length ? new Blob(chunks, { type: contentType }) : null;
  }, [contentType]);

  const start = useCallback(async () => {
    if (!MediaRecorder.isTypeSupported(`${contentType}`)) {
      throw new Error(
        "Your browser does not support the required audio format",
      );
    }

    // Request microphone access with processing disabled — the defaults
    // (noiseSuppression, echoCancellation, autoGainControl) are designed for
    // live calls and introduce audible artifacts in recordings.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 44100,
        channelCount: 1,
        noiseSuppression: false,
        echoCancellation: false,
        autoGainControl: false,
      },
    });
    streamRef.current = stream;

    // Set up audio level monitoring
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;

    // Samples the microphone 1024 times, computes RMS loudness, and converts it
    // to a normalized 0–1 audio level (shared scale with native). Levels below
    // the silence floor normalize to 0.
    const buffer = new Float32Array(analyser.fftSize);
    levelIntervalRef.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sum / buffer.length);
      // Round to limit re-renders to meaningful level changes.
      const level = Math.round(rmsToAudioLevel(rms) * 100) / 100;
      setAudioLevel(level);
    }, AUDIO_LEVEL_INTERVAL_MS);

    const isOpusCodecSupported = MediaRecorder.isTypeSupported(
      `${contentType};codecs=opus`,
    );

    // Create MediaRecorder for the stream
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: isOpusCodecSupported
        ? `${contentType};codecs=opus`
        : contentType,
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
  }, [onError, onStop, stop, contentType]);

  const cleanup = useCallback(async () => {
    await stop();
    await clearRecordedChunks();
  }, [stop]);

  return { start, stop, cleanup, isRecording, audioLevel };
};
