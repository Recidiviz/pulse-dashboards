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

import { OutputVoteValue } from "~@meetings/prisma/client";

export const createMeetingInputSchema = z.object({
  clientId: z.bigint(),
  startTime: z.date(),
  meetingId: z.string().cuid2(),
  meetingType: z.string().optional(),
  meetingTypeCategory: z.string().nullable().optional(),
});

export const getMeetingsInputSchema = z.object({
  clientId: z.bigint(),
});

export const caseloadFilterSchema = z.enum(["mine", "others", "all"]);

export const listFiltersSchema = z
  .object({
    search: z.string().trim().optional(),
    caseload: caseloadFilterSchema.default("all"),
  })
  .optional();

export const listSortSchema = z
  .object({
    sortBy: z.enum(["name", "id", "supervisionType", "lastMeeting"]).optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
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
    filters: listFiltersSchema,
    sort: listSortSchema,
  })
  .optional();

const cniFieldSchema = z.object({
  fieldValue: z.string(),
  quotes: z.array(z.string()),
  lastVerifiedDate: z.coerce.date(),
});

const cniEmploymentFieldsSchema = z.object({
  primaryStatus: cniFieldSchema,
  searchStatus: cniFieldSchema.optional(),
  employers: z.array(
    z
      .object({
        jobTitle: cniFieldSchema,
        employerName: cniFieldSchema,
        employerLocation: cniFieldSchema,
        payRateAmount: cniFieldSchema,
        employmentType: cniFieldSchema,
      })
      .partial(),
  ),
});

const cniHousingFieldsSchema = z
  .object({
    housedType: cniFieldSchema,
    dependentHousingType: cniFieldSchema,
    temporaryHousingName: cniFieldSchema,
    address: cniFieldSchema,
    temporaryHousingType: cniFieldSchema,
  })
  .partial()
  .extend({ primaryStatus: cniFieldSchema });

export const submitCNIFeedbackInputSchema = z.object({
  clientId: z.bigint(),
  vote: z.nativeEnum(OutputVoteValue),
  message: z.string().max(10000),
  snapshot: z.object({
    displayText: z.string(),
    summarySnapshots: z.array(
      z.object({
        summaryId: z.string(),
        cniSnapshot: z.union([
          cniEmploymentFieldsSchema,
          cniHousingFieldsSchema,
        ]),
        // purposefully loosely defined, since the runId infra is still being iterated
        cniRunIDs: z.object({}).catchall(z.string()),
      }),
    ),
  }),
});
