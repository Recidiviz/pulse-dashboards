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

import { create } from "zustand";

import { Person } from "../common/types";

export type ReconnectUploadStatus =
  | "pending"
  | "uploading"
  | "complete"
  | "error";

export type ReconnectUploadEntry = {
  person?: Person;
  recordedAt: Date;
  uploadedBytes: number;
  totalBytes: number;
  status: ReconnectUploadStatus;
};

type ReconnectUploadStore = {
  uploads: Record<string, ReconnectUploadEntry>;
  initUpload: (
    meetingId: string,
    entry: Omit<
      ReconnectUploadEntry,
      "uploadedBytes" | "totalBytes" | "status"
    >,
  ) => void;
  setUploadProgress: (
    meetingId: string,
    uploadedBytes: number,
    totalBytes: number,
  ) => void;
  setUploadStatus: (meetingId: string, status: ReconnectUploadStatus) => void;
  clear: () => void;
};

export const useReconnectUploadStore = create<ReconnectUploadStore>((set) => ({
  uploads: {},

  initUpload: (meetingId, entry) =>
    set((s) => {
      if (s.uploads[meetingId]) {
        return s;
      }
      return {
        uploads: {
          ...s.uploads,
          [meetingId]: {
            ...entry,
            uploadedBytes: 0,
            totalBytes: 0,
            status: "pending",
          },
        },
      };
    }),

  setUploadProgress: (meetingId, uploadedBytes, totalBytes) =>
    set((s) => ({
      uploads: {
        ...s.uploads,
        [meetingId]: {
          ...s.uploads[meetingId],
          uploadedBytes,
          totalBytes,
          status: "uploading",
        },
      },
    })),

  setUploadStatus: (meetingId, status) =>
    set((s) => ({
      uploads: {
        ...s.uploads,
        [meetingId]: {
          ...s.uploads[meetingId],
          status,
        },
      },
    })),

  clear: () => set({ uploads: {} }),
}));
