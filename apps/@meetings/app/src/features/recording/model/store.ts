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
import * as Sentry from "@sentry/react-native";
import { debounce, omit } from "lodash";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Person, PersonType } from "~@meetings/app/shared/api";

import { Status } from "./types";

// TODO(#11571):
// For now this store is web only.
// It can be added into RecordingContext.native freely and replace several separated states.

type RecordingStore = {
  status: Status;
  note: string; // UI only field
  debouncedNote: string; // save note into AsyncStorage with debounce
  person: Person | null;
  personType: PersonType | null;
  meetingId: string | null;
  meetingType: string | null;
  meetingTypeCategory: string | null;
  isRecordingViewMinimized: boolean;
  durationMs: number;

  setStatus: (status: Status) => void;
  setNote: (note: string) => void;
  setPerson: (person: Person | null) => void;
  setPersonType: (personType: PersonType | null) => void;
  setMeetingId: (meetingId: string | null) => void;
  setMeetingType: (meetingType: string | null) => void;
  setMeetingTypeCategory: (meetingTypeCategory: string | null) => void;
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
        personType: null,
        meetingId: null,
        meetingType: null,
        meetingTypeCategory: null,
        isRecordingViewMinimized: false,
        durationMs: 0,

        setStatus: (status: Status) => set({ status }),
        setNote: (note: string) => {
          set({ note });
          debouncedSaveNote(note);
        },
        setMeetingId: (meetingId: string | null) => set({ meetingId }),
        setMeetingType: (meetingType: string | null) => set({ meetingType }),
        setMeetingTypeCategory: (meetingTypeCategory: string | null) =>
          set({ meetingTypeCategory }),
        setPerson: (person: Person | null) => set({ person }),
        setPersonType: (personType: PersonType | null) => set({ personType }),
        setIsRecordingViewMinimized: (isMinimized: boolean) =>
          set({ isRecordingViewMinimized: isMinimized }),
        setDurationMs: (durationMs: number) => set({ durationMs }),
      };
    },
    {
      name: "recording-info",
      partialize: (state) => ({
        ...omit(state, ["note"]), // we save `debouncedNote` instead of `note`
        person: state.person
          ? { ...state.person, personId: state.person.personId.toString() }
          : null,
      }),
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        try {
          state.note = state.debouncedNote;

          if (state.person) {
            state.person = {
              ...state.person,
              personId: BigInt(state.person.personId),
            };
          }
        } catch (error) {
          console.error(error);
          Sentry.logger.error("meeting.rehydrateStore.error", {
            state,
            error,
          });
          // Rehydrating `person` failed (e.g. BigInt(personId) threw on a
          // corrupted value). Drop the person rather than leaving a string
          // `personId` where callers expect a bigint.
          state.person = null;
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
