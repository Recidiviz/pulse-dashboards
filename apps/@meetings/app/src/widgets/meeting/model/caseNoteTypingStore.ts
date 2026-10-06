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
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { pruneExpiredEntries } from "../lib/pruneExpiredEntries";

// Notes from meetings older than this never animate, so a "seen" entry is
// useless once it is this old and can be dropped. That keeps the store bounded
// by recent activity rather than by how long the app has been in use.
export const CASE_NOTE_TYPING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type CaseNoteTypingStore = {
  seen: Record<string, number>;
  markSeen: (key: string) => void;
};

export const useCaseNoteTypingStore = create<CaseNoteTypingStore>()(
  persist(
    (set) => ({
      seen: {},
      markSeen: (key) =>
        set(({ seen }) => ({
          seen: pruneExpiredEntries(
            { ...seen, [key]: Date.now() },
            CASE_NOTE_TYPING_WINDOW_MS,
          ),
        })),
    }),
    {
      name: "case-note-typing",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.seen = pruneExpiredEntries(
          state.seen,
          CASE_NOTE_TYPING_WINDOW_MS,
        );
      },
    },
  ),
);

export const useCaseNoteTypingStoreHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(
    useCaseNoteTypingStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useCaseNoteTypingStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    return useCaseNoteTypingStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
  }, []);

  return hasHydrated;
};
