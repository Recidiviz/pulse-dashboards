// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Box } from "@mui/material";
import type React from "react";
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";

import type { UIRecordingStatus } from "~@reentry/frontend/types/recording";
import { formatDuration } from "~@reentry/frontend/utils";

interface AudioWaveformProps {
  selectedMicrophone?: string;
  recordingStatus: UIRecordingStatus;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  isRecordingSupported: boolean;
  recordDuration?: number;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  selectedMicrophone,
  recordingStatus,
  onRecordingStart,
  onRecordingStop,
  isRecordingSupported,
  recordDuration = 0,
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<RecordPlugin | null>(null);

  useEffect(() => {
    if (!waveformRef.current || !isRecordingSupported) return;

    const waveSurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#4fc3f7",
      progressColor: "#29b6f6",
      cursorColor: "#1976d2",
      barWidth: 2,
      barGap: 1,
      height: 80,
      normalize: true,
      backend: "WebAudio",
    });

    const record = waveSurfer.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: false,
      }),
    );

    record.on("record-end", (blob: Blob) => {
      console.log("Recording ended, blob size:", blob.size);
      onRecordingStop?.();
    });

    record.on("record-start", () => {
      console.log("WaveSurfer recording started");
      onRecordingStart?.();
    });

    waveSurferRef.current = waveSurfer;
    recordPluginRef.current = record;

    return () => {
      if (waveSurfer) {
        waveSurfer.destroy();
      }
    };
  }, [isRecordingSupported, onRecordingStart, onRecordingStop]);

  useEffect(() => {
    const record = recordPluginRef.current;
    if (!record) return;

    const startMicrophoneVisualization = async () => {
      try {
        const deviceId = selectedMicrophone || undefined;
        await record.startMic({ deviceId });
      } catch (error) {
        console.error("Failed to start microphone visualization:", error);
      }
    };

    const stopMicrophoneVisualization = () => {
      try {
        record.stopMic();
      } catch (error) {
        console.error("Failed to stop microphone visualization:", error);
      }
    };

    if (recordingStatus === "recording") {
      startMicrophoneVisualization();
    } else {
      stopMicrophoneVisualization();
    }

    return () => {
      stopMicrophoneVisualization();
    };
  }, [recordingStatus, selectedMicrophone]);

  if (!isRecordingSupported) {
    return (
      <Box className="p-4 text-center text-gray-500">
        Audio visualization not available - recording not supported
      </Box>
    );
  }

  return (
    <Box className="w-full p-4">
      <div className="relative">
        <div
          ref={waveformRef}
          className="w-full rounded-md border border-gray-200 bg-gray-50"
          style={{ minHeight: "80px" }}
        />
        {(recordingStatus === "recording" || recordingStatus === "paused") &&
          recordDuration > 0 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-mono">
              {formatDuration(recordDuration)}
            </div>
          )}
      </div>
    </Box>
  );
};

export default AudioWaveform;
