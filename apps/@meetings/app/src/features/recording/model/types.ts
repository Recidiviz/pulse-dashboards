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

import { Person, PersonType } from "../../../common/types";

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
  status: Status;
  // Updates both status AND persistedStatus
  setStatus: (status: Status) => void;

  isRecording: boolean;
  durationMs: number;
  isSpeaking: boolean;

  note: string;
  setNote: (note: string) => void;

  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  discardRecording: () => Promise<void>;
  stopAndUploadRecording: () => Promise<Blob | null>;

  togglePauseResume: () => Promise<void>;

  // Cleanup everything — invoked when user discards or finishes
  cleanupRecording: () => Promise<void>;

  // High-level meeting actions (combining recording + API calls)
  handleFinishAndSave: (onComplete?: () => void) => Promise<void>;
  handleFinalDiscard: (onComplete?: () => void) => Promise<void>;
  // true once AsyncStorage rehydration completes; prevents from running on the pre-hydration default
  hasHydrated: boolean;
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
  meetingId: string | null;
  setMeetingId: (meetingId: string | null) => void;
  person: Person | null;
  personType: PersonType | null;
  setPerson: (person: Person | null) => void;
  setPersonType: (personType: PersonType | null) => void;
};
