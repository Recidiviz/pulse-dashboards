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
import { debounce, omit } from "lodash";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Person } from "~@meetings/app/common/types";

import { Status } from "./types";

// TODO(#11571):
// For now this store is web only.
// It can be added into RecordingContext.native freely and replace several separated states.

type RecordingStore = {
  status: Status;
  note: string; // UI only field
  debouncedNote: string; // save note into AsyncStorage with debounce
  person: Person | null;
  meetingId: string | null;
  isRecordingViewMinimized: boolean;
  durationMs: number;

  setStatus: (status: Status) => void;
  setNote: (note: string) => void;
  setPerson: (person: Person | null) => void;
  setMeetingId: (meetingId: string | null) => void;
  setIsRecordingViewMinimized: (isMinimized: boolean) => void;
  setDurationMs: (durationMs: number) => void;
};

export const useRecordingStore = create<RecordingStore>()(
  persist(
    (set) => {
      const debouncedSaveNote = debounce((note: string) => {
        set({ debouncedNote: note });
      }, 1000);

      return {
        status: "idle",
        note: "",
        debouncedNote: "",
        person: null,
        meetingId: null,
        isRecordingViewMinimized: false,
        durationMs: 0,

        setStatus: (status: Status) => set({ status }),
        setNote: (note: string) => {
          set({ note });
          debouncedSaveNote(note);
        },
        setMeetingId: (meetingId: string | null) => set({ meetingId }),
        setPerson: (person: Person | null) => set({ person }),
        setIsRecordingViewMinimized: (isMinimized: boolean) =>
          set({ isRecordingViewMinimized: isMinimized }),
        setDurationMs: (durationMs: number) => set({ durationMs }),
      };
    },
    {
      name: "recording-info",
      partialize: (state) => omit(state, ["note"]), // we save `debouncedNote` instead of `note`
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.note = state.debouncedNote;
        }
      },
    },
  ),
);

export const useRecordingStoreHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(
    useRecordingStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useRecordingStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    return useRecordingStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
  }, []);

  return hasHydrated;
};
