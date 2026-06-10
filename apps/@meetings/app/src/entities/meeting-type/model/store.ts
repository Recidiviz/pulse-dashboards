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

import { DEFAULT_MEETING_TYPE } from "../config";
import { getCategoryTypeError } from "../lib";

type MeetingTypeStore = {
  meetingType: string;
  meetingTypeCategory: string | null;
  meetingTypeCategoryError: string | null;
  setMeetingType: (meetingType: string) => void;
  setMeetingTypeCategory: (meetingTypeCategory: string | null) => void;
  setMeetingTypeCategoryError: (categoryType?: string | null) => void;
  reset: (meetingType?: string) => void;
};

const initialState = {
  meetingType: DEFAULT_MEETING_TYPE,
  meetingTypeCategory: null,
  meetingTypeCategoryError: null,
};

export const useMeetingTypeStore = create<MeetingTypeStore>()((set) => ({
  ...initialState,
  setMeetingType: (meetingType) => {
    set({
      meetingType,
      meetingTypeCategory: null,
      meetingTypeCategoryError: null,
    });
  },
  setMeetingTypeCategory: (meetingTypeCategory) => {
    set({ meetingTypeCategory });
    if (meetingTypeCategory) set({ meetingTypeCategoryError: null });
  },
  setMeetingTypeCategoryError: (categoryType) =>
    set({
      meetingTypeCategoryError: getCategoryTypeError(categoryType),
    }),
  reset: (meetingType) =>
    set({ ...initialState, meetingType: meetingType ?? DEFAULT_MEETING_TYPE }),
}));
