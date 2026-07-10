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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistStorage } from "zustand/middleware";

import { createEventQueueStorage } from "./meetingEventQueueStorage.native";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const STORAGE_KEY = "meeting_events";

type TestEvent = {
  eventId: string;
  createdAt: Date;
  metadata: {
    type: string;
    meetingId: string;
    startTime?: Date;
    endTime?: Date;
  };
};

type TestState = {
  eventsByUser: Record<string, TestEvent[]>;
};

function getTestStorage() {
  return createEventQueueStorage() as unknown as PersistStorage<TestState>;
}

describe("createEventQueueStorage (native)", () => {
  it("revives createdAt, startTime, and endTime as Date instances", async () => {
    const persisted = {
      state: {
        eventsByUser: {
          "user-1": [
            {
              eventId: "event-1",
              createdAt: "2026-06-01T12:00:00.000Z",
              metadata: {
                type: "created",
                meetingId: "meeting-1",
                startTime: "2026-06-01T12:00:00.000Z",
              },
            },
            {
              eventId: "event-2",
              createdAt: "2026-06-02T09:30:00.000Z",
              metadata: {
                type: "ended",
                meetingId: "meeting-1",
                endTime: "2026-06-02T09:30:00.000Z",
              },
            },
          ],
        },
      },
      version: 1,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    const storage = getTestStorage();
    const result = await storage?.getItem(STORAGE_KEY);

    const events = result?.state.eventsByUser["user-1"] ?? [];
    expect(events[0]?.createdAt).toBeInstanceOf(Date);
    expect(events[0]?.createdAt.toISOString()).toBe("2026-06-01T12:00:00.000Z");
    expect(events[0]?.metadata.startTime).toBeInstanceOf(Date);
    expect(events[0]?.metadata.startTime?.toISOString()).toBe(
      "2026-06-01T12:00:00.000Z",
    );

    expect(events[1]?.createdAt).toBeInstanceOf(Date);
    expect(events[1]?.metadata.endTime).toBeInstanceOf(Date);
    expect(events[1]?.metadata.endTime?.toISOString()).toBe(
      "2026-06-02T09:30:00.000Z",
    );
  });

  it("leaves non-date fields as strings", async () => {
    const persisted = {
      state: {
        eventsByUser: {
          "user-1": [
            {
              eventId: "event-1",
              createdAt: "2026-06-01T12:00:00.000Z",
              metadata: {
                type: "ended",
                meetingId: "meeting-1",
                endTime: "2026-06-01T12:00:00.000Z",
              },
            },
          ],
        },
      },
      version: 1,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    const storage = getTestStorage();
    const result = await storage?.getItem(STORAGE_KEY);

    const event = result?.state.eventsByUser["user-1"]?.[0];
    expect(typeof event?.metadata.type).toBe("string");
    expect(typeof event?.metadata.meetingId).toBe("string");
    expect(event?.eventId).toBe("event-1");
  });

  it("round-trips through setItem and getItem preserving date values", async () => {
    const storage = getTestStorage();
    const value = {
      state: {
        eventsByUser: {
          "user-1": [
            {
              eventId: "event-1",
              createdAt: new Date("2026-06-01T12:00:00.000Z"),
              metadata: {
                type: "ended" as const,
                meetingId: "meeting-1",
                endTime: new Date("2026-06-01T13:00:00.000Z"),
              },
            },
          ],
        },
      },
      version: 1,
    };

    await storage?.setItem(STORAGE_KEY, value);
    const result = await storage?.getItem(STORAGE_KEY);

    const event = result?.state.eventsByUser["user-1"]?.[0];
    expect(event?.createdAt.getTime()).toBe(
      new Date("2026-06-01T12:00:00.000Z").getTime(),
    );
    expect(event?.metadata.endTime?.getTime()).toBe(
      new Date("2026-06-01T13:00:00.000Z").getTime(),
    );
  });

  it("returns null when nothing has been persisted", async () => {
    const storage = getTestStorage();
    const result = await storage?.getItem("nonexistent-key");
    expect(result).toBeNull();
  });
});
