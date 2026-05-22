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
  createdOn: firestoreTimestampSchema,
  updatedOn: firestoreTimestampSchema.optional(),
  deletedOn: firestoreTimestampSchema.nullable().default(null),
  stateCode: z.string(),
});

export type CustomTaskRecord = z.infer<typeof customTaskSchema>;
export type CustomTaskCreateInput = Pick<CustomTaskRecord, "title" | "dueDate">;
export type CustomTaskUpdateInput = Partial<
  Pick<CustomTaskRecord, "title" | "dueDate" | "completedOn">
>;
