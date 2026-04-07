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
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useUserContext } from "../context/UserContext";
import { createEventQueueStorage } from "../utils/meetingEventQueueStorage";
import { MeetingEvent, OfflineEvent } from "./useMeetingEventQueue";

const STORE_NAME = "failed_offline_events";

type OfflineFailureQueueState = {
  events: MeetingEvent[];
  enqueue: (metadata: OfflineEvent) => void;
  dequeue: () => MeetingEvent["metadata"] | null;
};

type OfflineFailureQueueStoreState = {
  eventsByUser: Record<string, MeetingEvent[]>;
  enqueue: (userId: string, metadata: OfflineEvent) => void;
  dequeue: (userId: string) => MeetingEvent["metadata"] | null;
};

const _offlineFailureQueueStore = create<OfflineFailureQueueStoreState>()(
  persist(
    (set, get) => ({
      eventsByUser: {},
      enqueue: (userId, metadata) =>
        set((s) => ({
          eventsByUser: {
            ...s.eventsByUser,
            [userId]: [
              ...(s.eventsByUser[userId] ?? []),
              { eventId: crypto.randomUUID(), createdAt: new Date(), metadata },
            ],
          },
        })),
      dequeue: (userId) => {
        const events = get().eventsByUser[userId] ?? [];
        if (events.length === 0) return null;
        const [firstEvent, ...rest] = events;
        set((s) => ({ eventsByUser: { ...s.eventsByUser, [userId]: rest } }));
        return firstEvent.metadata;
      },
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
 * Returns the failure queue scoped to the currently logged-in user.
 */
export function useOfflineFailureQueue(): OfflineFailureQueueState {
  const { email } = useUserContext();
  const userId = email ?? "";
  const store = _offlineFailureQueueStore();

  const enqueue = useCallback(
    (metadata: OfflineEvent) => store.enqueue(userId, metadata),
    [store, userId],
  );
  const dequeue = useCallback(() => store.dequeue(userId), [store, userId]);

  return {
    events: store.eventsByUser[userId] ?? [],
    enqueue,
    dequeue,
  };
}
