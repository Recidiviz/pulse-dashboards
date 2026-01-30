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

import { DBSchema, openDB } from "idb";

const DB_NAME = "meeting_recorder_db";
const STORE_NAME = "recording_chunks";
const DB_VERSION = 1;

type RecorderDB = DBSchema & {
  recording_chunks: {
    key: number;
    value: Blob;
  };
};

const dbPromise = openDB<RecorderDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { autoIncrement: true });
  },
});

export const saveChunk = async (blob: Blob) => {
  const db = await dbPromise;
  await db.add(STORE_NAME, blob);
};

export const getAllChunksAndCreateBlob = async () => {
  const db = await dbPromise;
  const chunks = await db.getAll(STORE_NAME);
  return chunks.length ? new Blob(chunks, { type: "audio/webm" }) : null;
};

export const clearRecordedChunks = async () => {
  const db = await dbPromise;
  await db.clear(STORE_NAME);
};
