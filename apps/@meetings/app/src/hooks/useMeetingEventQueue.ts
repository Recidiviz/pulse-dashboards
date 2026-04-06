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

import uuid from "react-native-uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { PersonType } from "~@meetings/app/common/types";

import { createEventQueueStorage } from "../utils/meetingEventQueueStorage";

export type OfflineEvent =
  | CreateMeetingEvent
  | EndMeetingEvent
  | DiscardMeetingEvent
  | EditMeetingEvent;

export type MeetingEvent = {
  eventId: string;
  createdAt: Date;
  metadata: OfflineEvent;
};

export enum MeetingEventType {
  Created = "created",
  Ended = "ended",
  Discarded = "discarded",
  Edited = "edited",
}

type MeetingEventMetadata = {
  meetingId: string;
  type: MeetingEventType;
  personId?: bigint;
  personType?: PersonType;
};

export type CreateMeetingEvent = {
  startTime: Date;
  type: MeetingEventType.Created;
} & MeetingEventMetadata;

export type EndMeetingEvent = {
  endTime: Date;
  type: MeetingEventType.Ended;
  audioUri?: string;
  audioBlob?: Blob;
  userNotepadNotes?: string;
} & MeetingEventMetadata;

export type DiscardMeetingEvent = {
  type: MeetingEventType.Discarded;
} & MeetingEventMetadata;

export type EditMeetingEvent = {
  type: MeetingEventType.Edited;
  userNotepadNotes?: string;
  actionItems?: string[];
  criticalUpdates?: string[];
  caseNote?: string;
} & MeetingEventMetadata;

export type MeetingEventQueueState = {
  events: MeetingEvent[];
  enqueue: (metadata: OfflineEvent) => void;
  dequeue: () => MeetingEvent["metadata"] | null;
  getMeetingsFor: (personId: bigint, personType: PersonType) => MeetingEvent[];
  removeEventsOfType: (
    meetingId: string,
    type: MeetingEventType,
  ) => MeetingEvent[];
  clear: () => void;
};

const STORE_NAME = "meeting_events";

export const useMeetingEventQueue = create<MeetingEventQueueState>()(
  persist(
    (set, get) => ({
      events: [],
      enqueue: (metadata) =>
        set((s) => {
          return {
            events: [
              ...s.events,
              { eventId: uuid.v4(), createdAt: new Date(), metadata },
            ],
          };
        }),
      dequeue: () => {
        const { events } = get();
        if (events.length === 0) {
          return null;
        }

        const oldest = events.reduce((a, b) =>
          b.createdAt < a.createdAt ? b : a,
        );

        set((s) => ({
          events: s.events.filter((e) => e.eventId !== oldest.eventId),
        }));

        return oldest.metadata;
      },
      removeEventsOfType: (meetingId: string, type: MeetingEventType) => {
        const { events } = get();
        const removed = events.filter(
          (e) => e.metadata.meetingId === meetingId && e.metadata.type === type,
        );
        if (removed.length > 0) {
          set((s) => ({
            events: s.events.filter(
              (e) =>
                !(
                  e.metadata.meetingId === meetingId && e.metadata.type === type
                ),
            ),
          }));
        }
        return removed;
      },
      getMeetingsFor: (personId: bigint, personType: PersonType) => {
        const { events } = get();

        return events.filter(
          (e) =>
            e.metadata.personId === personId &&
            e.metadata.personType === personType,
        );
      },
      clear: () => set({ events: [] }),
    }),
    {
      name: STORE_NAME,
      storage: createEventQueueStorage(),
      partialize: (state) => ({ events: state.events }),
    },
  ),
);
