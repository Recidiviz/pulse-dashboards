// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { z } from "zod";

export const createMeetingInputSchema = z.object({
  clientId: z.bigint(),
  startTime: z.date(),
  meetingId: z.string().cuid2(),
  meetingType: z.string(),
});

export const getMeetingsInputSchema = z.object({
  clientId: z.bigint(),
});

export const clientSortBySchema = z.enum([
  "name",
  "id",
  "supervisionType",
  "lastMeeting",
]);

export const caseloadFilterSchema = z.enum(["mine", "others", "all"]);

export const listFiltersSchema = z
  .object({
    search: z.string().trim().optional(),
    caseload: caseloadFilterSchema.default("all"),
  })
  .optional();

export const listInputSchema = z
  .object({
    // Despite the name, this is a page number, not a true cursor — pagination
    // here is offset-based (see `meeting.helpers.ts`). The field is named
    // `cursor` because tRPC's `useInfiniteQuery` integration requires an input
    // field with that exact name.
    cursor: z.number().int().min(1).optional(),
    size: z.number().int().min(1).default(20),
    sortBy: clientSortBySchema.default("name"),
    filters: listFiltersSchema,
  })
  .optional();
