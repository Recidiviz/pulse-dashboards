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

import * as Sentry from "@sentry/react-native";
import { create } from "zustand";

import { getPersonType } from "~@meetings/app/entities/person";
import { Person, PersonType } from "~@meetings/app/shared/api";

type ActiveMeetingState = {
  meetingId: string | null;
  person: Person | null;
  personType: PersonType | null;
  meetingType: string | null;
  meetingTypeCategory: string | null;
  note: string;
  isMinimized: boolean;
  showEndModal: boolean;
  showDiscardModal: boolean;
  showStillThereModal: boolean;
  controlsDisabled: boolean;
  isSidebarCollapsed: boolean;
  lastActivityAt: number;

  openMeeting: (params: {
    meetingId: string;
    person: Person;
    meetingType: string | null;
    meetingTypeCategory: string | null;
  }) => void;
  setNote: (note: string) => void;
  setIsMinimized: (isMinimized: boolean) => void;
  setShowDiscardModal: (showDiscardModal: boolean) => void;
  setShowEndModal: (showEndModal: boolean) => void;
  setShowStillThereModal: (showStillThereModal: boolean) => void;
  setControlsDisabled: (disableControls: boolean) => void;
  setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
  markActivity: () => void;
  cleanup: () => void;
};

export const useActiveMeetingStore = create<ActiveMeetingState>()(
  (set, get, store) => ({
    meetingId: null,
    person: null,
    personType: null,
    meetingType: null,
    meetingTypeCategory: null,
    note: "",
    isMinimized: false,
    showEndModal: false,
    showDiscardModal: false,
    showStillThereModal: false,
    controlsDisabled: false,
    isSidebarCollapsed: false,
    lastActivityAt: Date.now(),

    openMeeting: (params) => {
      Sentry.setTag("meetingId", params.meetingId);
      set({
        meetingId: params.meetingId,
        person: params.person,
        personType: getPersonType(params.person),
        meetingType: params.meetingType,
        meetingTypeCategory: params.meetingTypeCategory,
      });
    },
    setNote: (note) => set({ note, lastActivityAt: Date.now() }),
    setIsMinimized: (isMinimized) =>
      set({ isMinimized, lastActivityAt: Date.now() }),
    setShowDiscardModal: (showDiscardModal) =>
      set({ showDiscardModal, lastActivityAt: Date.now() }),
    setShowEndModal: (showEndModal) =>
      set({ showEndModal, lastActivityAt: Date.now() }),
    setShowStillThereModal: (showStillThereModal) =>
      set({ showStillThereModal }),
    setControlsDisabled: (controlsDisabled) => set({ controlsDisabled }),
    setIsSidebarCollapsed: (isSidebarCollapsed) =>
      set({ isSidebarCollapsed, lastActivityAt: Date.now() }),
    markActivity: () => set({ lastActivityAt: Date.now() }),
    cleanup: () => {
      Sentry.setTag("meetingId", null);
      set(store.getInitialState());
    },
  }),
);
