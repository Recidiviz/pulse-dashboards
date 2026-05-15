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

type MeetingTypeStore = {
  meetingType: string | null;
  meetingTypeError: string | null;
  setMeetingType: (meetingType: string | null) => void;
  setMeetingTypeError: () => void;
  resetMeetingTypeError: () => void;
};

const initialState = {
  meetingType: null,
  meetingTypeError: null,
};

export const useMeetingTypeStore = create<MeetingTypeStore>()((set) => ({
  ...initialState,
  setMeetingType: (meetingType) => set({ meetingType }),
  setMeetingTypeError: () =>
    set({
      meetingTypeError:
        "Please select a meeting type before starting a meeting",
    }),
  resetMeetingTypeError: () => set({ meetingTypeError: null }),
}));
