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

import { randomUUID } from "crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { PersonType } from "~@meetings/app/common/types";

import { meetingEventQueueStorage } from "./meetingEventQueueStorage";

export type MeetingEvent = {
  eventId: string;
  createdAt: Date;
  metadata: CreateMeetingEvent | EndMeetingEvent | DiscardMeetingEvent;
};

type MeetingEventType = "created" | "ended" | "discarded";

type MeetingEventMetadata = {
  personId: string;
  personType: PersonType;
  type: MeetingEventType;
};

export type CreateMeetingEvent = {
  meetingId: null;
  startTime: Date;
  type: "created";
} & MeetingEventMetadata;

export type EndMeetingEvent = {
  meetingId: string;
  endTime: Date;
  type: "ended";
  audioBlob?: Blob;
  audioUri?: string;
} & MeetingEventMetadata;

export type DiscardMeetingEvent = {
  meetingId: string;
  type: "discarded";
} & MeetingEventMetadata;

type MeetingEventQueueState = {
  events: MeetingEvent[];
  enqueue: (
    metadata: CreateMeetingEvent | EndMeetingEvent | DiscardMeetingEvent,
  ) => void;
  dequeue: () => MeetingEvent["metadata"] | null;
  clear: () => void;
};

const STORE_NAME = "meeting_events";

export const useMeetingEventQueue = create<MeetingEventQueueState>()(
  persist(
    (set, get) => ({
      events: [],
      enqueue: (metadata) =>
        set((s) => ({
          events: [
            ...s.events,
            { eventId: randomUUID(), createdAt: new Date(), metadata },
          ],
        })),
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
      clear: () => set({ events: [] }),
    }),
    {
      name: STORE_NAME,
      storage: createJSONStorage(() => meetingEventQueueStorage, {
        reviver: (key, value) => {
          if (key === "createdAt" && typeof value === "string") {
            return new Date(value);
          }
          return value;
        },
      }),
    },
  ),
);
