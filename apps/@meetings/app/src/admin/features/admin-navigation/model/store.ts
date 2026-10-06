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

import { RootStackParamList } from "~@meetings/app/shared/config";

export type AdminScreen = Extract<
  keyof RootStackParamList,
  "AgencyConfig" | "AdminFlaggedMeetings"
>;

const DEFAULT_ADMIN_SCREEN: AdminScreen = "AdminFlaggedMeetings";

type AdminNavigationStore = {
  lastScreen: AdminScreen;
  setLastScreen: (screen: AdminScreen) => void;
};

// The profile menu's Admin entry opens whichever admin screen was used last.
export const useAdminNavigationStore = create<AdminNavigationStore>()(
  persist(
    (set) => ({
      lastScreen: DEFAULT_ADMIN_SCREEN,
      setLastScreen: (screen) => set({ lastScreen: screen }),
    }),
    {
      name: "admin-navigation",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
