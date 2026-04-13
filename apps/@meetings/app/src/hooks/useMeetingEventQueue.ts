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

import { useCallback } from "react";
import uuid from "react-native-uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Person, PersonType } from "~@meetings/app/common/types";

import { useUserContext } from "../context/UserContext";
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
  person?: Person;
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
  head: () => MeetingEvent["metadata"] | null;
  dequeue: () => MeetingEvent["metadata"] | null;
  getMeetingsFor: (personId: bigint, personType: PersonType) => MeetingEvent[];
  removeEventsOfType: (
    meetingId: string,
    type: MeetingEventType,
  ) => MeetingEvent[];
  clear: () => void;
};

type MeetingEventQueueStoreState = {
  eventsByUser: Record<string, MeetingEvent[]>;
  enqueue: (userId: string, metadata: OfflineEvent) => void;
  head: (userId: string) => MeetingEvent["metadata"] | null;
  dequeue: (userId: string) => MeetingEvent["metadata"] | null;
  getMeetingsFor: (
    userId: string,
    personId: bigint,
    personType: PersonType,
  ) => MeetingEvent[];
  removeEventsOfType: (
    userId: string,
    meetingId: string,
    type: MeetingEventType,
  ) => MeetingEvent[];
  clear: (userId: string) => void;
};

const STORE_NAME = "meeting_events";

const _meetingEventQueueStore = create<MeetingEventQueueStoreState>()(
  persist(
    (set, get) => ({
      eventsByUser: {},
      enqueue: (userId, metadata) =>
        set((s) => ({
          eventsByUser: {
            ...s.eventsByUser,
            [userId]: [
              ...(s.eventsByUser[userId] ?? []),
              { eventId: uuid.v4(), createdAt: new Date(), metadata },
            ],
          },
        })),
      dequeue: (userId) => {
        const events = get().eventsByUser[userId] ?? [];
        if (events.length === 0) return null;

        const oldest = events.reduce((a, b) =>
          b.createdAt < a.createdAt ? b : a,
        );

        set((s) => ({
          eventsByUser: {
            ...s.eventsByUser,
            [userId]: (s.eventsByUser[userId] ?? []).filter(
              (e) => e.eventId !== oldest.eventId,
            ),
          },
        }));

        return oldest.metadata;
      },
      head: (userId) => {
        const events = get().eventsByUser[userId] ?? [];
        if (events.length === 0) return null;

        return events.reduce((a, b) => (b.createdAt < a.createdAt ? b : a))
          .metadata;
      },
      removeEventsOfType: (userId, meetingId, type) => {
        const events = get().eventsByUser[userId] ?? [];
        const removed = events.filter(
          (e) => e.metadata.meetingId === meetingId && e.metadata.type === type,
        );
        if (removed.length > 0) {
          set((s) => ({
            eventsByUser: {
              ...s.eventsByUser,
              [userId]: (s.eventsByUser[userId] ?? []).filter(
                (e) =>
                  !(
                    e.metadata.meetingId === meetingId &&
                    e.metadata.type === type
                  ),
              ),
            },
          }));
        }
        return removed;
      },
      getMeetingsFor: (userId, personId, personType) => {
        const events = get().eventsByUser[userId] ?? [];
        return events.filter(
          (e) =>
            e.metadata.personId === personId &&
            e.metadata.personType === personType,
        );
      },
      clear: (userId) =>
        set((s) => ({
          eventsByUser: { ...s.eventsByUser, [userId]: [] },
        })),
    }),
    {
      name: STORE_NAME,
      storage: createEventQueueStorage(),
      version: 1,
      migrate: () => ({ eventsByUser: {} }),
      partialize: (state) => ({ eventsByUser: state.eventsByUser }),
    },
  ),
);

/**
 * Returns the offline event queue scoped to the currently logged-in user.
 * Events enqueued by one user are never visible to another user on the same device.
 */
export function useMeetingEventQueue(): MeetingEventQueueState {
  const { email } = useUserContext();
  const userId = email ?? "";
  const store = _meetingEventQueueStore();

  const enqueue = useCallback(
    (metadata: OfflineEvent) => store.enqueue(userId, metadata),
    [store, userId],
  );

  const head = useCallback(() => store.head(userId), [store, userId]);

  const dequeue = useCallback(() => store.dequeue(userId), [store, userId]);

  const getMeetingsFor = useCallback(
    (personId: bigint, personType: PersonType) =>
      store.getMeetingsFor(userId, personId, personType),
    [store, userId],
  );

  const removeEventsOfType = useCallback(
    (meetingId: string, type: MeetingEventType) =>
      store.removeEventsOfType(userId, meetingId, type),
    [store, userId],
  );

  const clear = useCallback(() => store.clear(userId), [store, userId]);

  return {
    events: store.eventsByUser[userId] ?? [],
    enqueue,
    head,
    dequeue,
    getMeetingsFor,
    removeEventsOfType,
    clear,
  };
}
