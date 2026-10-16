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

export type FlaggedMeetingsTab = "needs" | "reviewed" | "all" | "staffEmails";
export type StaffEmailsView = "toSend" | "sent";

type FlaggedMeetingsTabStore = {
  tab: FlaggedMeetingsTab;
  staffEmailsView: StaffEmailsView;
  setTab: (tab: FlaggedMeetingsTab) => void;
  setStaffEmailsView: (view: StaffEmailsView) => void;
};

// Kept outside the screen so going back from a meeting returns to the same tab.
export const useFlaggedMeetingsTabStore = create<FlaggedMeetingsTabStore>()(
  (set) => ({
    tab: "needs",
    staffEmailsView: "toSend",
    setTab: (tab) => set({ tab }),
    setStaffEmailsView: (staffEmailsView) => set({ staffEmailsView }),
  }),
);
