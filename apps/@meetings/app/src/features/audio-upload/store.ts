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

import { PersonType } from "~@meetings/app/common/types";

import { AudioUploadDialog, AudioUploadStatus, FileInfo } from "./types";

type AudioUploadStore = {
  // Persisted fields
  status: AudioUploadStatus;
  dialog: AudioUploadDialog;
  meetingId: string | null;
  personId: bigint | null;
  personType: PersonType | null;
  file: FileInfo | null;
  error: string | null; // file uploading error

  // Non-persisted fields (progress resets on reload)
  uploadedBytes: number;
  totalBytes: number;

  setStatus: (status: AudioUploadStatus) => void;
  setDialog: (dialog: AudioUploadDialog) => void;
  setMeetingId: (meetingId: string | null) => void;
  setFile: (file: FileInfo | null) => void;
  setError: (error: string | null) => void;
  setUploadProgress: (uploaded: number, total: number) => void;
  open: (params: {
    personId: bigint;
    personType: PersonType;
    meetingId: string;
  }) => void;
  reset: () => void;
};

const initialState = {
  status: null,
  dialog: null,
  meetingId: null,
  personId: null,
  personType: null,
  file: null,
  error: null,
  uploadedBytes: 0,
  totalBytes: 0,
};

export const useAudioUploadStore = create<AudioUploadStore>()(
  persist(
    (set) => ({
      ...initialState,

      setStatus: (status) => set({ status }),
      setDialog: (dialog) => set({ dialog }),
      setMeetingId: (meetingId) => set({ meetingId }),
      setFile: (file) => set({ file }),
      setError: (error) => set({ error }),
      setUploadProgress: (uploadedBytes, totalBytes) =>
        set({ uploadedBytes, totalBytes }),
      open: ({ personId, personType, meetingId }) =>
        set({
          ...initialState,
          personId,
          personType,
          meetingId,
          status: "selecting",
        }),
      reset: () => set(initialState),
    }),
    {
      name: "audio-upload-info",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        status: state.status,
        dialog: state.dialog,
        meetingId: state.meetingId,
        personId: state.personId ? state.personId.toString() : null,
        file: state.file,
        error: state.error,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.status === "uploading") {
          state.status = "selecting";
          state.error = "Upload was interrupted. Please try again.";
        }
        if (state.personId) {
          state.personId = BigInt(state.personId);
        }
        if (state.error && !state.file) {
          state.setError(null);
        }
        state.dialog = null;
      },
    },
  ),
);
