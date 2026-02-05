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

export type RecordingStatus =
  | "idle"
  | "recording"
  | "paused"
  | "uploading"
  | "stopping"
  | "discarding"
  | "ending";

export type Recording = {
  // runtimeStatus: in-memory status that updates UI
  status: RecordingStatus | null;

  // Updates both runtimeStatus AND persistedStatus
  setStatus: (status: RecordingStatus) => void;

  isRecording: boolean;
  durationMs: number;

  note: string;
  setNote: (note: string) => void;

  startRecording: () => Promise<void>;
  stopRecording: (uploadFn: (uri: string) => Promise<void>) => Promise<void>;
  discardRecording: (uploadFn: (uri: string) => Promise<void>) => Promise<void>;
  stopAndUploadRecording: (
    uploadFn: (uri: string) => Promise<void>,
  ) => Promise<void>;

  togglePauseResume: (
    uploadFn: (uri: string) => Promise<void>,
  ) => Promise<void>;

  // Cleanup everything — invoked when user discards or finishes
  cleanupRecording: () => Promise<void>;
};
