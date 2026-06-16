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

import { renderHook } from "@testing-library/react-native";

import { trpc } from "~@meetings/app/shared/api";

import {
  MeetingEventType,
  useMeetingEventQueue,
} from "../useMeetingEventQueue";
import { useOfflineEventFactory } from "../useOfflineEventFactory";

jest.mock("../useMeetingEventQueue", () => ({
  MeetingEventType: {
    Created: "created",
    Ended: "ended",
    Discarded: "discarded",
    Edited: "edited",
  },
  useMeetingEventQueue: jest.fn(),
}));

jest.mock("~@meetings/app/shared/api/trpc", () => ({
  __esModule: true,
  trpc: {
    useUtils: jest.fn(),
  },
}));

const mockEnqueue = jest.fn();
const mockClientSetData = jest.fn();
const mockResidentSetData = jest.fn();
const mockMeetingDetailsSetData = jest.fn();

const MEETING_ID = "meeting-123";
const MEETING_TYPE = "TEST_TYPE";
const PERSON_ID = BigInt(456);
const START_TIME = new Date("2026-01-01T10:00:00Z");
const END_TIME = new Date("2026-01-01T11:00:00Z");

beforeEach(() => {
  jest.clearAllMocks();

  (useMeetingEventQueue as unknown as jest.Mock).mockReturnValue({
    enqueue: mockEnqueue,
  });

  (trpc.useUtils as jest.Mock).mockReturnValue({
    v1: {
      client: {
        getMeetings: { setData: mockClientSetData },
      },
      resident: {
        getMeetings: { setData: mockResidentSetData },
      },
      meeting: {
        getDetails: { setData: mockMeetingDetailsSetData },
      },
    },
  });
});

describe("useOfflineEventFactory", () => {
  describe("dispatch - Created event", () => {
    it("enqueues the event with all fields", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Created,
        meetingId: MEETING_ID,
        meetingType: MEETING_TYPE,
        meetingTypeCategory: null,
        personId: PERSON_ID,
        personType: "client",
        startTime: START_TIME,
      });
      expect(mockEnqueue).toHaveBeenCalledWith({
        type: MeetingEventType.Created,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "client",
        meetingType: MEETING_TYPE,
        meetingTypeCategory: null,
        startTime: START_TIME,
      });
    });

    it("adds the new meeting to the client meetings cache", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Created,
        meetingId: MEETING_ID,
        meetingType: MEETING_TYPE,
        meetingTypeCategory: null,
        personId: PERSON_ID,
        personType: "client",
        startTime: START_TIME,
      });

      expect(mockClientSetData).toHaveBeenCalledWith(
        { clientId: PERSON_ID },
        expect.any(Function),
      );
      const [, updater] = mockClientSetData.mock.calls[0];
      const updated = updater([{ id: "existing-meeting" }]);
      expect(updated).toContainEqual(
        expect.objectContaining({
          id: MEETING_ID,
          startTime: START_TIME,
          endTime: null,
          postMeetingProcessingStatus: "NOT_STARTED",
        }),
      );
      expect(updated).toContainEqual(
        expect.objectContaining({ id: "existing-meeting" }),
      );
    });

    it("adds the new meeting to the resident meetings cache for resident personType", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Created,
        meetingId: MEETING_ID,
        meetingType: MEETING_TYPE,
        meetingTypeCategory: null,
        personId: PERSON_ID,
        personType: "resident",
        startTime: START_TIME,
      });

      expect(mockResidentSetData).toHaveBeenCalledWith(
        { residentId: PERSON_ID },
        expect.any(Function),
      );
      expect(mockClientSetData).not.toHaveBeenCalled();
    });

    it("sets the meeting details in cache", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Created,
        meetingId: MEETING_ID,
        meetingType: MEETING_TYPE,
        meetingTypeCategory: null,
        personId: PERSON_ID,
        personType: "client",
        startTime: START_TIME,
      });

      expect(mockMeetingDetailsSetData).toHaveBeenCalledWith(
        { meetingId: MEETING_ID },
        expect.objectContaining({
          id: MEETING_ID,
          startTime: START_TIME,
          endTime: null,
          caseNote: null,
          userNotepadNotes: null,
          postMeetingProcessingStatus: "NOT_STARTED",
        }),
      );
    });
  });

  describe("dispatch - Ended event", () => {
    it("enqueues the event with all fields", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Ended,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "client",
        endTime: END_TIME,
      });
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MeetingEventType.Ended,
          meetingId: MEETING_ID,
          endTime: END_TIME,
        }),
      );
    });

    it("updates the target meeting in the client cache with endTime and STITCHING_QUEUED status", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Ended,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "client",
        endTime: END_TIME,
      });

      expect(mockClientSetData).toHaveBeenCalledWith(
        { clientId: PERSON_ID },
        expect.any(Function),
      );
      const [, updater] = mockClientSetData.mock.calls[0];
      const existing = [
        {
          id: MEETING_ID,
          endTime: null,
          postMeetingProcessingStatus: "NOT_STARTED",
        },
        {
          id: "other-meeting",
          endTime: null,
          postMeetingProcessingStatus: "NOT_STARTED",
        },
      ];
      const updated = updater(existing);
      expect(updated).toContainEqual(
        expect.objectContaining({
          id: MEETING_ID,
          endTime: END_TIME,
          postMeetingProcessingStatus: "STITCHING_QUEUED",
        }),
      );
      // Does not affect other meetings
      expect(updated).toContainEqual(
        expect.objectContaining({
          id: "other-meeting",
          endTime: null,
          postMeetingProcessingStatus: "NOT_STARTED",
        }),
      );
    });

    it("updates the meeting details cache with endTime and STITCHING_QUEUED status", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Ended,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "client",
        endTime: END_TIME,
      });

      const [, updater] = mockMeetingDetailsSetData.mock.calls[0];
      const updated = updater({
        id: MEETING_ID,
        endTime: null,
        postMeetingProcessingStatus: "NOT_STARTED",
      });
      expect(updated).toMatchObject({
        endTime: END_TIME,
        postMeetingProcessingStatus: "STITCHING_QUEUED",
      });
    });

    it("returns undefined from the details updater when there is no existing cached details", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Ended,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "client",
        endTime: END_TIME,
      });

      const [, updater] = mockMeetingDetailsSetData.mock.calls[0];
      expect(updater(undefined)).toBeUndefined();
    });

    it("updates the resident cache for resident personType", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Ended,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "resident",
        endTime: END_TIME,
      });

      expect(mockResidentSetData).toHaveBeenCalledWith(
        { residentId: PERSON_ID },
        expect.any(Function),
      );
      expect(mockClientSetData).not.toHaveBeenCalled();
    });
  });

  describe("dispatch - Discarded event", () => {
    it("enqueues the event", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Discarded,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "client",
      });
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MeetingEventType.Discarded,
          meetingId: MEETING_ID,
        }),
      );
    });

    it("removes the meeting from the client cache", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Discarded,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "client",
      });

      expect(mockClientSetData).toHaveBeenCalledWith(
        { clientId: PERSON_ID },
        expect.any(Function),
      );
      const [, updater] = mockClientSetData.mock.calls[0];
      const updated = updater([{ id: MEETING_ID }, { id: "other-meeting" }]);
      expect(updated).not.toContainEqual(
        expect.objectContaining({ id: MEETING_ID }),
      );
      expect(updated).toContainEqual(
        expect.objectContaining({ id: "other-meeting" }),
      );
    });

    it("removes the meeting from the resident cache for resident personType", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Discarded,
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: "resident",
      });

      expect(mockResidentSetData).toHaveBeenCalledWith(
        { residentId: PERSON_ID },
        expect.any(Function),
      );
      expect(mockClientSetData).not.toHaveBeenCalled();
    });
  });

  describe("dispatch - Edited event", () => {
    it("enqueues the event", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Edited,
        meetingId: MEETING_ID,
        userNotepadNotes: "my notes",
      });
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MeetingEventType.Edited,
          meetingId: MEETING_ID,
          userNotepadNotes: "my notes",
        }),
      );
    });

    it("updates the meeting details cache with provided fields", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Edited,
        meetingId: MEETING_ID,
        userNotepadNotes: "updated notes",
        actionItems: ["action 1", "action 2"],
        caseNote: "case note text",
        criticalUpdates: ["critical 1"],
      });

      expect(mockMeetingDetailsSetData).toHaveBeenCalledWith(
        { meetingId: MEETING_ID },
        expect.any(Function),
      );
      const [, updater] = mockMeetingDetailsSetData.mock.calls[0];
      const updated = updater({
        id: MEETING_ID,
        userNotepadNotes: "old notes",
        actionItems: [],
        caseNote: null,
        criticalUpdates: null,
      });
      expect(updated).toMatchObject({
        userNotepadNotes: "updated notes",
        actionItems: ["action 1", "action 2"],
        caseNote: "case note text",
        criticalUpdates: ["critical 1"],
      });
    });

    it("preserves existing values for fields not included in the event", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Edited,
        meetingId: MEETING_ID,
        actionItems: ["new action"],
        // userNotepadNotes and caseNote omitted
      });

      const [, updater] = mockMeetingDetailsSetData.mock.calls[0];
      const updated = updater({
        id: MEETING_ID,
        userNotepadNotes: "existing notes",
        actionItems: [],
        caseNote: "existing case note",
        criticalUpdates: null,
      });
      expect(updated.userNotepadNotes).toBe("existing notes");
      expect(updated.caseNote).toBe("existing case note");
      expect(updated.actionItems).toEqual(["new action"]);
    });

    it("returns undefined from the details updater when there is no existing cached details", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.dispatch({
        type: MeetingEventType.Edited,
        meetingId: MEETING_ID,
        userNotepadNotes: "notes",
      });

      const [, updater] = mockMeetingDetailsSetData.mock.calls[0];
      expect(updater(undefined)).toBeUndefined();
    });
  });

  describe("removeMeetingFromCache", () => {
    it("filters the meeting out of the client meetings list", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.removeMeetingFromCache(MEETING_ID, PERSON_ID, "client");

      expect(mockClientSetData).toHaveBeenCalledWith(
        { clientId: PERSON_ID },
        expect.any(Function),
      );
      const [, updater] = mockClientSetData.mock.calls[0];
      const updated = updater([{ id: MEETING_ID }, { id: "other" }]);
      expect(updated).toEqual([{ id: "other" }]);
    });

    it("filters the meeting out of the resident meetings list", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.removeMeetingFromCache(MEETING_ID, PERSON_ID, "resident");

      expect(mockResidentSetData).toHaveBeenCalledWith(
        { residentId: PERSON_ID },
        expect.any(Function),
      );
      expect(mockClientSetData).not.toHaveBeenCalled();
    });

    it("returns undefined from the updater when the existing list is undefined", () => {
      const { result } = renderHook(() => useOfflineEventFactory());
      result.current.removeMeetingFromCache(MEETING_ID, PERSON_ID, "client");

      const [, updater] = mockClientSetData.mock.calls[0];
      expect(updater(undefined)).toBeUndefined();
    });
  });
});
