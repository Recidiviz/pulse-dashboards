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

import { useActiveMeetingStore } from "../activeMeetingStore";

jest.mock("@sentry/react-native", () => ({
  setTag: jest.fn(),
}));

jest.mock("~@meetings/app/entities/person", () => ({
  getPersonType: jest.fn().mockReturnValue("client"),
}));

const mockPerson = {
  personId: "person-1",
  fullName: "John Doe",
  primaryMetadata: "",
  lastMeeting: "",
  supervisionType: "PROBATION",
} as never;

describe("activeMeetingStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useActiveMeetingStore.getState().cleanup();
  });

  it("has correct initial state", () => {
    const state = useActiveMeetingStore.getState();
    expect(state.meetingId).toBeNull();
    expect(state.person).toBeNull();
    expect(state.personType).toBeNull();
    expect(state.meetingType).toBeNull();
    expect(state.meetingTypeCategory).toBeNull();
    expect(state.note).toBe("");
    expect(state.isMinimized).toBe(false);
    expect(state.showEndModal).toBe(false);
    expect(state.showDiscardModal).toBe(false);
    expect(state.controlsDisabled).toBe(false);
  });

  describe("openMeeting", () => {
    it("sets meeting state and tags Sentry", () => {
      useActiveMeetingStore.getState().openMeeting({
        meetingId: "m-1",
        person: mockPerson,
        meetingType: "Assessment",
        meetingTypeCategory: "supervision",
      });

      const state = useActiveMeetingStore.getState();
      expect(state.meetingId).toBe("m-1");
      expect(state.person).toBe(mockPerson);
      expect(state.personType).toBe("client");
      expect(state.meetingType).toBe("Assessment");
      expect(state.meetingTypeCategory).toBe("supervision");
      expect(Sentry.setTag).toHaveBeenCalledWith("meetingId", "m-1");
    });
  });

  describe("setters", () => {
    it("setNote", () => {
      useActiveMeetingStore.getState().setNote("test note");
      expect(useActiveMeetingStore.getState().note).toBe("test note");
    });

    it("setIsMinimized", () => {
      useActiveMeetingStore.getState().setIsMinimized(true);
      expect(useActiveMeetingStore.getState().isMinimized).toBe(true);
    });

    it("setShowEndModal", () => {
      useActiveMeetingStore.getState().setShowEndModal(true);
      expect(useActiveMeetingStore.getState().showEndModal).toBe(true);
    });

    it("setShowDiscardModal", () => {
      useActiveMeetingStore.getState().setShowDiscardModal(true);
      expect(useActiveMeetingStore.getState().showDiscardModal).toBe(true);
    });

    it("setControlsDisabled", () => {
      useActiveMeetingStore.getState().setControlsDisabled(true);
      expect(useActiveMeetingStore.getState().controlsDisabled).toBe(true);
    });
  });

  describe("activity tracking", () => {
    beforeEach(() => {
      jest.spyOn(Date, "now").mockReturnValue(1000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it.each([
      ["markActivity", () => useActiveMeetingStore.getState().markActivity()],
      ["setNote", () => useActiveMeetingStore.getState().setNote("note")],
      [
        "setIsMinimized",
        () => useActiveMeetingStore.getState().setIsMinimized(true),
      ],
      [
        "setShowEndModal",
        () => useActiveMeetingStore.getState().setShowEndModal(true),
      ],
      [
        "setShowDiscardModal",
        () => useActiveMeetingStore.getState().setShowDiscardModal(true),
      ],
    ])("%s updates lastActivityAt", (_, action) => {
      action();
      expect(useActiveMeetingStore.getState().lastActivityAt).toBe(1000);
    });

    it("setShowStillThereModal does not update lastActivityAt", () => {
      useActiveMeetingStore.getState().setShowStillThereModal(true);
      expect(useActiveMeetingStore.getState().lastActivityAt).not.toBe(1000);
    });
  });

  describe("cleanup", () => {
    it("resets all state and clears Sentry tag", () => {
      useActiveMeetingStore.getState().openMeeting({
        meetingId: "m-1",
        person: mockPerson,
        meetingType: "Assessment",
        meetingTypeCategory: "supervision",
      });
      useActiveMeetingStore.getState().setNote("some note");
      useActiveMeetingStore.getState().setIsMinimized(true);
      useActiveMeetingStore.getState().setShowEndModal(true);
      useActiveMeetingStore.getState().setShowDiscardModal(true);
      useActiveMeetingStore.getState().setControlsDisabled(true);

      jest.clearAllMocks();
      useActiveMeetingStore.getState().cleanup();

      const state = useActiveMeetingStore.getState();
      expect(state.meetingId).toBeNull();
      expect(state.person).toBeNull();
      expect(state.personType).toBeNull();
      expect(state.meetingType).toBeNull();
      expect(state.meetingTypeCategory).toBeNull();
      expect(state.note).toBe("");
      expect(state.isMinimized).toBe(false);
      expect(state.showEndModal).toBe(false);
      expect(state.showDiscardModal).toBe(false);
      expect(state.controlsDisabled).toBe(false);
      expect(Sentry.setTag).toHaveBeenCalledWith("meetingId", null);
    });
  });
});
