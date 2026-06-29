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

import { PersonType, trpc } from "~@meetings/app/shared/api";

import {
  CreateMeetingEvent,
  DiscardMeetingEvent,
  EditMeetingEvent,
  EndMeetingEvent,
  MeetingEventType,
  OfflineEvent,
  useMeetingEventQueue,
} from "./useMeetingEventQueue";

export function useOfflineEventFactory() {
  const { enqueue } = useMeetingEventQueue();
  const utils = trpc.useUtils();

  function removeMeetingFromCache(
    meetingId: string,
    personId: bigint,
    personType: PersonType,
  ) {
    const removeFromList = <T extends { id: string }>(old: T[] | undefined) =>
      old?.filter((m) => m.id !== meetingId);

    if (personType === "client") {
      utils.v1.client.getMeetings.setData(
        { clientId: personId },
        removeFromList,
      );
    } else {
      utils.v1.resident.getMeetings.setData(
        { residentId: personId },
        removeFromList,
      );
    }
  }

  function dispatch(event: OfflineEvent) {
    enqueue(event);

    switch (event.type) {
      case MeetingEventType.Created: {
        const {
          meetingId,
          meetingType,
          meetingTypeCategory,
          personId,
          personType,
          startTime,
        } = event as CreateMeetingEvent;
        if (!personId || !personType) break;

        const newMeeting = {
          id: meetingId,
          meetingType,
          meetingTypeCategory: meetingTypeCategory ?? null,
          startTime,
          endTime: null,
          durationMs: null,
          postMeetingProcessingStatus: "NOT_STARTED" as const,
          caseNote: null,
          validationErrorType: null,
        };

        if (personType === "client") {
          utils.v1.client.getMeetings.setData({ clientId: personId }, (old) => [
            ...(old ?? []),
            newMeeting,
          ]);
        } else {
          utils.v1.resident.getMeetings.setData(
            { residentId: personId },
            (old) => [...(old ?? []), newMeeting],
          );
        }

        utils.v1.meeting.getDetails.setData(
          { meetingId },
          {
            id: meetingId,
            meetingType,
            meetingTypeCategory: meetingTypeCategory ?? null,
            startTime,
            endTime: null,
            durationMs: null,
            caseNote: null,
            userNotepadNotes: null,
            actionItems: null,
            structuredActionItems: null,
            criticalUpdates: null,
            meetingSummary: null,
            staffFeedback: null,
            currentFeedbackVote: null,
            caseNoteEditedAt: null,
            actionItemsEditedAt: null,
            approvals: {
              caseNote: false,
              actionItems: false,
            },
            postMeetingProcessingStatus: "NOT_STARTED",
            validationErrorType: null,
            transcriptDeletedAt: null,
            transcription: null,
            staffEmail: "",
            audioUrl: null,
          },
        );
        break;
      }

      case MeetingEventType.Ended: {
        const { meetingId, personId, personType, endTime } =
          event as EndMeetingEvent;
        if (!personId || !personType) break;

        if (personType === "client") {
          utils.v1.client.getMeetings.setData({ clientId: personId }, (old) =>
            old?.map((m) => {
              if (m.id !== meetingId) return m;
              return {
                ...m,
                endTime,
                postMeetingProcessingStatus: "STITCHING_QUEUED" as const,
              };
            }),
          );
        } else {
          utils.v1.resident.getMeetings.setData(
            { residentId: personId },
            (old) =>
              old?.map((m) => {
                if (m.id !== meetingId) return m;
                return {
                  ...m,
                  endTime,
                  postMeetingProcessingStatus: "STITCHING_QUEUED" as const,
                };
              }),
          );
        }

        utils.v1.meeting.getDetails.setData({ meetingId }, (old) => {
          if (!old) return old;
          return {
            ...old,
            endTime,
            postMeetingProcessingStatus: "STITCHING_QUEUED" as const,
          };
        });
        break;
      }

      case MeetingEventType.Discarded: {
        const { meetingId, personId, personType } =
          event as DiscardMeetingEvent;
        if (!personId || !personType) break;
        removeMeetingFromCache(meetingId, personId, personType);
        break;
      }

      case MeetingEventType.Edited: {
        const {
          meetingId,
          actionItems,
          caseNote,
          userNotepadNotes,
          criticalUpdates,
        } = event as EditMeetingEvent;
        utils.v1.meeting.getDetails.setData({ meetingId }, (old) => {
          if (!old) return old;
          return {
            ...old,
            userNotepadNotes: userNotepadNotes ?? old.userNotepadNotes,
            criticalUpdates: criticalUpdates ?? old.criticalUpdates,
            actionItems: actionItems ?? old.actionItems,
            caseNote: caseNote ?? old.caseNote,
          };
        });
        break;
      }
    }
  }

  return { dispatch, removeMeetingFromCache };
}
