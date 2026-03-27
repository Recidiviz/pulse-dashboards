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

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { openDB } from "idb";
import superjson from "superjson";

const DB_NAME = "meetings-query-cache";
const STORE_NAME = "keyval";
const DB_VERSION = 1;

const getDb = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });

// createAsyncStoragePersister expects string values (it serializes to JSON itself)
const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const db = await getDb();
    return (await db.get(STORE_NAME, key)) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const db = await getDb();
    await db.put(STORE_NAME, value, key);
  },
  removeItem: async (key: string): Promise<void> => {
    const db = await getDb();
    await db.delete(STORE_NAME, key);
  },
};

export const queryCachePersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: "meetings-query-cache",
  serialize: superjson.stringify,
  deserialize: superjson.parse,
});
