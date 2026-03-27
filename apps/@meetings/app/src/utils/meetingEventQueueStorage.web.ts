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

import { openDB } from "idb";
import { PersistStorage, StorageValue } from "zustand/middleware";

const DB_NAME = "meeting-event-queue";
const STORE_NAME = "keyval";
const DB_VERSION = 3;

const getDb = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // v3: migrate to structured-clone storage (blobs supported natively).
      // Drop all old stores and recreate clean — any queued events from prior
      // versions used JSON strings and are no longer readable.
      if (oldVersion < 3) {
        Array.from(db.objectStoreNames).forEach((name) =>
          db.deleteObjectStore(name),
        );
        db.createObjectStore(STORE_NAME);
      }
    },
  });

export const createEventQueueStorage = <T>(): PersistStorage<T> => ({
  getItem: async (name): Promise<StorageValue<T> | null> => {
    const db = await getDb();
    return (await db.get(STORE_NAME, name)) ?? null;
  },
  setItem: async (name, value: StorageValue<T>): Promise<void> => {
    const db = await getDb();
    await db.put(STORE_NAME, value, name);
  },
  removeItem: async (name): Promise<void> => {
    const db = await getDb();
    await db.delete(STORE_NAME, name);
  },
});
