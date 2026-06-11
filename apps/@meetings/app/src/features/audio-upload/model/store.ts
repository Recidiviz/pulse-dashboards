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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Person, PersonType } from "~@meetings/app/entities/person";

import { AudioUploadDialog, AudioUploadStatus, FileInfo } from "./types";

type AudioUploadStore = {
  // Persisted fields
  status: AudioUploadStatus;
  meetingId: string | null;
  meetingType: string | null;
  meetingTypeCategory: string | null;
  person: Person | null;
  personType: PersonType | null;
  file: FileInfo | null;
  error: string | null; // file uploading error
  recordingDate: Date | null;
  recordingTime: Date | null;
  userNotepadNotes: string | null;

  // Non-persisted fields (progress resets on reload)
  dialog: AudioUploadDialog;
  uploadedBytes: number;
  totalBytes: number;

  setStatus: (status: AudioUploadStatus) => void;
  setDialog: (dialog: AudioUploadDialog) => void;
  setMeetingId: (meetingId: string | null) => void;
  setMeetingType: (meetingType: string | null) => void;
  setMeetingTypeCategory: (meetingTypeCategory: string | null) => void;
  setFile: (file: FileInfo | null) => void;
  setError: (error: string | null) => void;
  setUploadProgress: (uploaded: number, total: number) => void;
  setRecordingDate: (date: Date | null) => void;
  setRecordingTime: (time: Date | null) => void;
  setUserNotepadNotes: (notes: string | null) => void;
  open: (params: {
    person: Person;
    personType: PersonType;
    meetingType: string | null;
    meetingTypeCategory: string | null;
  }) => void;
  reset: () => void;
};

const initialState = {
  status: null,
  dialog: null,
  meetingId: null,
  meetingType: null,
  meetingTypeCategory: null,
  personType: null,
  person: null,
  file: null,
  error: null,
  uploadedBytes: 0,
  totalBytes: 0,
  recordingDate: null,
  recordingTime: null,
  userNotepadNotes: null,
};

export const useAudioUploadStore = create<AudioUploadStore>()(
  persist(
    (set) => ({
      ...initialState,

      setStatus: (status) => set({ status }),
      setDialog: (dialog) => set({ dialog }),
      setMeetingId: (meetingId) => set({ meetingId }),
      setMeetingType: (meetingType) => set({ meetingType }),
      setMeetingTypeCategory: (meetingTypeCategory) =>
        set({ meetingTypeCategory }),
      setFile: (file) => set({ file }),
      setError: (error) => set({ error }),
      setUploadProgress: (uploadedBytes, totalBytes) =>
        set({ uploadedBytes, totalBytes }),
      setRecordingDate: (recordingDate) => set({ recordingDate }),
      setRecordingTime: (recordingTime) => set({ recordingTime }),
      setUserNotepadNotes: (userNotepadNotes) => set({ userNotepadNotes }),
      open: ({ person, personType, meetingType, meetingTypeCategory }) =>
        set({
          ...initialState,
          person,
          personType,
          meetingType,
          meetingTypeCategory,
          status: "selecting",
        }),
      reset: () => set(initialState),
    }),
    {
      name: "audio-upload-info",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        status: state.status,
        meetingId: state.meetingId,
        person: state.person
          ? { ...state.person, personId: state.person.personId.toString() }
          : null,
        personType: state.personType,
        file: state.file,
        error: state.error,
        recordingDate: state.recordingDate,
        recordingTime: state.recordingTime,
        userNotepadNotes: state.userNotepadNotes,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.status === "uploading") {
          state.status = "selecting";
          state.error = "Upload was interrupted. Please try again.";
        }
        if (state.person) {
          state.person = {
            ...state.person,
            personId: BigInt(state.person.personId),
          };
        }
        if (state.error && !state.file) {
          state.setError(null);
        }
        if (state.recordingDate) {
          state.recordingDate = new Date(state.recordingDate);
        }
        if (state.recordingTime) {
          state.recordingTime = new Date(state.recordingTime);
        }
      },
    },
  ),
);
