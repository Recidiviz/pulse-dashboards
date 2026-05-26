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

import { Timestamp } from "firebase/firestore";
import { z } from "zod";

/**
 * A Firestore Timestamp coming off the wire. We accept both Firestore Timestamp
 * instances (production / emulator) and JS Date objects (tests / offline fixtures).
 * `FirestoreQuerySubscription.updateData` calls `doc.data({ serverTimestamps:
 * "estimate" })`, so pending `serverTimestamp()` writes also arrive as a Timestamp.
 */
const firestoreTimestampSchema = z.union([z.instanceof(Timestamp), z.date()]);

export const customTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  dueDate: firestoreTimestampSchema,
  completedOn: firestoreTimestampSchema.nullable().optional(),
  // iCal RFC-5545 RRULE string (e.g. "FREQ=WEEKLY;BYDAY=FR"). Null means a
  // one-off task. Serialised + parsed by the `rrule` library via helpers in
  // `components/DatePicker/recurrence.ts`. Defaults to null on parse so the
  // create path's `customTaskCreatePayloadSchema.parse(...)` writes
  // `recurrence: null` to Firestore even when the caller omits it — the same
  // schema-driven-default pattern `deletedOn` uses.
  recurrence: z.string().nullable().default(null),
  createdOn: firestoreTimestampSchema,
  updatedOn: firestoreTimestampSchema.optional(),
  deletedOn: firestoreTimestampSchema.nullable().default(null),
  stateCode: z.string(),
});

export type CustomTaskRecord = z.infer<typeof customTaskSchema>;
export type CustomTaskCreateInput = Pick<
  CustomTaskRecord,
  "title" | "dueDate"
> & {
  recurrence?: string | null;
};
export type CustomTaskUpdateInput = Partial<
  Pick<CustomTaskRecord, "title" | "dueDate" | "completedOn" | "recurrence">
>;

/**
 * Subset of `customTaskSchema` used for write-time validation in
 * `FirestoreStore.createCustomTask`. Omits the server-stamped timestamps
 * (`createdOn`, `updatedOn`) because those arrive as Firestore `FieldValue`
 * sentinels — not `Timestamp | Date` — and the FirestoreStore merges them
 * in *after* this schema's `.parse()`.
 *
 * Routing the create through `.parse()` ensures every field with a Zod
 * `.default(...)` on the parent schema lands in the Firestore document.
 * Today that's `deletedOn: null` — required by `CustomTasksSubscription`'s
 * `where("deletedOn", "==", null)` filter. Firestore has no way to match
 * documents that omit the field, so the create path must always write it.
 * Any future defaulted field is picked up the same way with no
 * FirestoreStore change.
 */
export const customTaskCreatePayloadSchema = customTaskSchema.omit({
  createdOn: true,
  updatedOn: true,
});

export type CustomTaskCreatePayload = z.infer<
  typeof customTaskCreatePayloadSchema
>;
