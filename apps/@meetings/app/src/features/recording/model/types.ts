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

import { ReactNode } from "react";

import { Person } from "~@meetings/app/common/types";

export type Status =
  | "idle"
  | "recording"
  | "paused"
  | "uploading"
  | "stopping"
  | "discarding"
  | "ending";

export type RecordingProviderProps = {
  children: ReactNode;
};

export type RecordingBase = {
  // status: in-memory status that updates UI
  status: Status | null;
  // Updates both status AND persistedStatus
  setStatus: (status: Status) => void;

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

export type RecordingWeb = RecordingBase & {
  isRecordingViewMinimized: boolean;
  setIsRecordingViewMinimized: (isMinimized: boolean) => void;
  meetingId: string | null;
  person: Person | null;
  openRecordingView: ({
    meetingId,
    person,
  }: {
    meetingId: string;
    person: Person;
  }) => void;
  closeRecordingView: () => void;
};

export type RecordingNative = RecordingBase & {
  // TODO: absence of meetingId in context was the main reason of separated context and useMeetingRecording
  // we can combine them after adding meetingId to native. see ./store.ts for more details.
  // it can be done as a part of https://github.com/Recidiviz/pulse-dashboards/issues/11571
  // meetingId: string | null;
};
