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

import { registerAacEncoder } from "@mediabunny/aac-encoder";
import {
  BufferTarget,
  canEncodeAudio,
  MediaStreamAudioTrackSource,
  Mp4OutputFormat,
  Output,
  Quality,
} from "mediabunny";
import { useRef, useState } from "react";

import { AUDIO_LEVEL_INTERVAL_MS, MAX_RECORDING_SEC } from "../config";
import { rmsToAudioLevel } from "../lib/audioLevel";
import { RecorderState } from "./recorderStates";
import { AudioRecorder, AudioRecorderProps } from "./types";

export function useRecorder(props: AudioRecorderProps = {}): AudioRecorder {
  const outputRef = useRef<Output<Mp4OutputFormat, BufferTarget> | null>(null);
  const targetRef = useRef<BufferTarget | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioTrackSource | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const levelIntervalRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const recordedSecondsRef = useRef<number>(0);

  const [durationSec, setDurationSec] = useState(0);

  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);

  const grabMic = (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 44100,
        channelCount: 1,
        noiseSuppression: false,
        echoCancellation: false,
        autoGainControl: false,
      },
    });
  };

  const releaseMic = () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
  };

  const _monitorStreamDb = async (stream: MediaStream) => {
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyzer = audioCtx.createAnalyser();
    analyzer.fftSize = 1024;
    source.connect(analyzer);
    analyzerRef.current = analyzer;

    const buffer = new Float32Array(analyzer.fftSize);
    levelIntervalRef.current = window.setInterval(() => {
      analyzer.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sum / buffer.length);
      const level = Math.round(rmsToAudioLevel(rms) * 100) / 100;
      setAudioLevel(level);
    }, AUDIO_LEVEL_INTERVAL_MS);
  };

  // Monitor for changes in recording duration every Xms (less than a second to pick up on weird time discrepancies)
  const _monitorDuration = () => {
    durationIntervalRef.current = window.setInterval(() => {
      const audioSource = audioSourceRef.current;
      if (!audioSource || audioSource.paused) {
        return;
      }
      const recordedSec = Math.ceil(recordedSecondsRef.current);
      setDurationSec(recordedSec);

      if (recordedSec >= MAX_RECORDING_SEC) {
        pause();
        props.config?.onDurationLimitReached();
      }
    }, 500);
  };

  const _cleanup = () => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
      recordedSecondsRef.current = 0;
      setDurationSec(0);
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyzerRef.current = null;
    setAudioLevel(0);
  };

  const start = async (): Promise<void> => {
    // Some browsers (Firefox) can't encode AAC, so we can leverage
    // Mediabunny's own AAC encoder
    if (!(await canEncodeAudio("aac"))) {
      registerAacEncoder();
    }

    setDurationSec(0);
    recordedSecondsRef.current = 0;

    const stream = await grabMic();
    micStreamRef.current = stream;

    _monitorStreamDb(stream);
    _monitorDuration();

    // Basically, we're gonna be writing bits to a buffer during recording, then finalizing the buffer into a
    // valid .mp4 file
    const target = new BufferTarget();
    targetRef.current = target;

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target,
    });
    outputRef.current = output;

    // Here, we're doing some Mediabunny shenanigans to take our stream (the user's mic)
    // and create a Mediabunny AudioSource to use to write to that buffer. All the writing
    // happens in stop()
    const audioTrack = stream.getAudioTracks()[0];
    const audioSource = new MediaStreamAudioTrackSource(audioTrack, {
      codec: "aac",
      quality: new Quality({ bitrate: 128_000 }),
      // during packet encoding is our only hook into recording duration
      onEncodedPacket: (packet) => {
        recordedSecondsRef.current = packet.timestamp + packet.duration;
      },
    });
    output.addAudioTrack(audioSource);
    audioSourceRef.current = audioSource;
    await output.start();
    setRecorderState("recording");
  };

  const stop = async (): Promise<void> => {
    const output = outputRef.current;

    _cleanup();
    releaseMic();
    if (!output || output.state !== "started") {
      setRecorderState("idle");
      return;
    }

    await output.finalize();
    setRecorderState("idle");
  };

  const getUrl = (): string | null => {
    const target = targetRef.current;

    if (!target?.buffer) return null;

    const blob = new Blob([target.buffer], { type: "audio/mp4" });
    const url = URL.createObjectURL(blob);
    return url;
  };

  const resume = () => {
    const audioSource = audioSourceRef.current;
    if (!audioSource) {
      return;
    }

    setRecorderState("recording");
    audioSource.resume();
  };

  const pause = () => {
    const audioSource = audioSourceRef.current;

    if (!audioSource) {
      return;
    }

    setRecorderState("paused");
    audioSource.pause();
  };

  const discard = async () => {
    const output = outputRef.current;
    if (output && output.state === "started") {
      await output.cancel();
    }
    _cleanup();
    releaseMic();
    setRecorderState("idle");
    outputRef.current = null;
    targetRef.current = null;
  };

  return {
    start,
    stop,
    getUrl,
    discard,
    resume,
    pause,
    state: recorderState,
    audioLevel,
    durationMs: Math.ceil(durationSec * 1000),
  };
}
