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

import { act, render } from "@testing-library/react-native";
import React from "react";
import { Platform } from "react-native";

import { Person } from "~@meetings/app/shared/api";

import { ProfileMeetings } from "./ProfileMeetings";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Capture the onSuccess callback that ProfileMeetings passes down, so we can
// invoke it directly without needing to simulate a full tRPC mutation.
let capturedOnSuccess: ((meetingId: string) => void) | undefined;
jest.mock("~@meetings/app/entities/meeting", () => ({
  useCreateMeeting: jest.fn(
    ({ onSuccess }: { onSuccess: (meetingId: string) => void }) => {
      capturedOnSuccess = onSuccess;
      return { handleCreateMeeting: jest.fn(), isCreating: false };
    },
  ),
}));

// mock-prefixed variables are hoisted by Jest alongside jest.mock calls,
// so they're safely accessible inside factory functions.
let mockMeetingTypes: { type: string }[] = [];
const mockSetMeetingId = jest.fn();
const mockSetMeetingType = jest.fn();
const mockSetPerson = jest.fn();
const mockSetPersonType = jest.fn();
const mockStartRecording = jest.fn();
const mockOpenRecordingView = jest.fn();
const mockTrack = jest.fn();
const mockResetMeetingTypeStore = jest.fn();

jest.mock("~@meetings/app/entities/agency-config", () => ({
  useAgencyConfigs: () => ({
    agencyConfigs: {
      US_NE: { stateCode: "US_NE", meetingTypes: mockMeetingTypes },
    },
    isLoading: false,
  }),
}));

jest.mock("~@meetings/app/context/StateContext", () => ({
  useStateSelection: () => ({ selectedStateCode: "US_NE" }),
}));

jest.mock("~@meetings/app/shared/analytics", () => ({
  useAnalytics: () => ({ track: mockTrack }),
}));

jest.mock("~@meetings/app/features/recording", () => ({
  MeetingControlsMobile: () => null,
  useRecording: jest.fn(() => ({
    status: null,
    setMeetingId: mockSetMeetingId,
    setMeetingType: mockSetMeetingType,
    setPerson: mockSetPerson,
    setPersonType: mockSetPersonType,
    startRecording: mockStartRecording,
    openRecordingView: mockOpenRecordingView,
  })),
}));

jest.mock("~@meetings/app/features/audio-upload", () => ({
  useAudioUploadStore: jest.fn(
    (selector?: (s: { open: jest.Mock; status: string }) => unknown) => {
      const store = { open: jest.fn(), status: "idle" };
      return selector ? selector(store) : store;
    },
  ),
}));

jest.mock("~@meetings/app/entities/meeting-type", () => ({
  useMeetingTypeStore: () => ({
    meetingType: null,
    meetingTypeCategory: null,
    meetingTypeCategoryError: null,
    setMeetingType: jest.fn(),
    setMeetingTypeCategory: jest.fn(),
    setMeetingTypeCategoryError: jest.fn(),
    reset: mockResetMeetingTypeStore,
  }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useIsFocused: () => false,
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("~@meetings/app/shared/lib/useIsMobileWidth", () => ({
  useIsMobileWidth: () => true,
}));

jest.mock("~@meetings/app/components/Header", () => () => null);
jest.mock("./MeetingsTable.web", () => () => null);
jest.mock("./NewMeetingOptionsModal", () => ({
  NewMeetingOptionsModal: () => null,
}));
jest.mock("./NewMeetingRecordingSheet", () => ({
  NewMeetingRecordingSheet: () => null,
}));
jest.mock("./MeetingsMobileList", () => () => null);
jest.mock("./MeetingsPlaceholder", () => () => null);
jest.mock("./MeetingsHeaderContent", () => () => null);

const MEETING_ID = "test-meeting-id";

const mockPerson = {
  personId: BigInt(1),
  fullName: "Test Person",
  primaryMetadata: "test",
  lastMeeting: "2026-01-01",
} as unknown as Person;

function renderComponent() {
  render(
    <ProfileMeetings
      person={mockPerson}
      personType="client"
      isLoading={false}
      error={null}
      refetch={jest.fn()}
    />,
  );
}

describe("ProfileMeetings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnSuccess = undefined;
    mockMeetingTypes = [];
  });

  describe("after a successful meeting creation", () => {
    describe("on native (iOS/Android)", () => {
      it("starts recording and sets meeting state", () => {
        renderComponent();
        act(() => {
          capturedOnSuccess?.(MEETING_ID);
        });

        expect(mockSetMeetingId).toHaveBeenCalledWith(MEETING_ID);
        expect(mockSetMeetingType).toHaveBeenCalledWith(null);
        expect(mockSetPerson).toHaveBeenCalledWith(mockPerson);
        expect(mockSetPersonType).toHaveBeenCalledWith("client");
        expect(mockStartRecording).toHaveBeenCalled();
        expect(mockOpenRecordingView).not.toHaveBeenCalled();
      });
    });

    describe("on web", () => {
      // The RN jest preset defaults Platform.OS to 'ios'; override it for web tests.
      beforeEach(() => {
        Platform.OS = "web" as typeof Platform.OS;
      });

      afterEach(() => {
        Platform.OS = "ios" as typeof Platform.OS;
      });

      it("opens the recording view and starts recording", () => {
        renderComponent();
        act(() => {
          capturedOnSuccess?.(MEETING_ID);
        });

        expect(mockOpenRecordingView).toHaveBeenCalledWith({
          meetingId: MEETING_ID,
          meetingType: null,
          meetingTypeCategory: null,
          person: mockPerson,
        });
        expect(mockStartRecording).toHaveBeenCalled();
        expect(mockSetMeetingId).not.toHaveBeenCalled();
      });
    });

    it("tracks the meeting_started analytics event", () => {
      renderComponent();
      act(() => {
        capturedOnSuccess?.(MEETING_ID);
      });

      expect(mockTrack).toHaveBeenCalledWith("meeting_started", {
        meetingId: MEETING_ID,
        personType: "client",
      });
    });

    it("resets the meeting type store to the first type when meetingTypes is configured", () => {
      mockMeetingTypes = [{ type: "Home Visit" }, { type: "Office Visit" }];
      renderComponent();
      act(() => {
        capturedOnSuccess?.(MEETING_ID);
      });

      expect(mockResetMeetingTypeStore).toHaveBeenCalledWith("Home Visit");
    });

    it("resets the meeting type store to undefined when meetingTypes is empty", () => {
      mockMeetingTypes = [];
      renderComponent();
      act(() => {
        capturedOnSuccess?.(MEETING_ID);
      });

      expect(mockResetMeetingTypeStore).toHaveBeenCalledWith(undefined);
    });
  });
});
