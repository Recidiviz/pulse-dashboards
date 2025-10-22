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

import type { components } from "~@reentry/frontend/recidiviz-schema";

export type RecordingSessionResponse =
  components["schemas"]["RecordingSessionResponse"];
export type RecordingSessionStatusResponse =
  components["schemas"]["RecordingSessionStatusResponse"];
export type ClientRecordResponse =
  components["schemas"]["ClientRecordResponse"];

export interface MediaDevice {
  deviceId: string;
  label: string;
}

export type RecordingStatus =
  | "created"
  | "recording"
  | "paused"
  | "completed"
  | "error";

// add a processing state to show that while frontend waits for backend status update.
export type UIRecordingStatus = RecordingStatus | "processing";

export interface RecordingState {
  status: RecordingStatus;
  uiStatus: UIRecordingStatus;
  selectedMicrophone: string;
  microphones: MediaDevice[];
  chunkCount: number;
  isOnline: boolean;
  cannotConnectToServer: boolean;
  pausedByVisibilityChange: boolean;
}

export interface RecordingActions {
  mediaRecorderRef?: React.MutableRefObject<MediaRecorder | null>;
  startRecording: () => Promise<void>;
  pauseRecording: (event?: Event | null, fromVisibilityChange?: boolean) => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  setSelectedMicrophone: (deviceId: string) => void;
}

export interface AudioCapabilities {
  hasMediaRecorder: boolean;
  supportedFormat: string | null;
  isRecordingSupported: boolean;
}

export interface QueuedChunk {
  id: string;
  sessionId: string;
  chunkIndex: number;
  chunkData: string; // base64
  mimeType: string;
  hasHeader: boolean;
  timestamp: number;
  chunkDuration: number; // duration in seconds
}
