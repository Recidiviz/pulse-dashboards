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

import { z } from "zod";

import {
  HomePlanInvestigationResult,
  ReleaseDecision,
} from "~@idaho-th/prisma/client";
import {
  HOME_PLAN_ADDRESS_MAX_LENGTH,
  ORDERED_RELEASE_TASK_TYPES,
  RELEASE_TASK_DATE_INVALID_ERROR,
  RELEASE_TASK_DETAILS,
  RELEASE_TASK_NOTE_MAX_LENGTH,
} from "~@idaho-th/shared";
import { parseDateString } from "~@idaho-th/trpc/utils/common";

export const getHomePlanSchema = z.object({
  applicationId: z.string(),
});

export const acceptProviderAsHomePlanSchema = z.object({
  applicationId: z.string(),
  providerId: z.string(),
});

export const setManualAddressHomePlanSchema = z.object({
  applicationId: z.string(),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(HOME_PLAN_ADDRESS_MAX_LENGTH),
});

// Either decision alone is a valid save: the CM records them as the information
// arrives, in whichever order.
export const setApprovalsSchema = z
  .object({
    applicationId: z.string(),
    releaseDecision: z.nativeEnum(ReleaseDecision).optional(),
    homePlanInvestigation: z.nativeEnum(HomePlanInvestigationResult).optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.releaseDecision != null || input.homePlanInvestigation != null,
    { message: "At least one approvals decision is required" },
  );

export const toggleReleaseTaskSchema = z.object({
  applicationId: z.string(),
  taskType: z.enum(ORDERED_RELEASE_TASK_TYPES),
  completed: z.boolean(),
});

const releaseTaskDetailBase = {
  applicationId: z.string(),
  taskType: z.enum(ORDERED_RELEASE_TASK_TYPES),
};

const releaseTaskTextDetailSchema = z
  .object({
    ...releaseTaskDetailBase,
    type: z.literal("text"),
    note: z
      .string()
      .trim()
      .max(RELEASE_TASK_NOTE_MAX_LENGTH)
      .nullable()
      .transform((value) => (value === "" ? null : value)),
  })
  .strict();

// The client sends `yyyy-MM-dd`; it is stored as UTC midnight in a DATE column.
const releaseTaskDateDetailSchema = z
  .object({
    ...releaseTaskDetailBase,
    type: z.literal("date"),
    date: z
      .string()
      .nullable()
      .refine((value) => value == null || parseDateString(value) != null, {
        message: RELEASE_TASK_DATE_INVALID_ERROR,
      })
      .transform((value) => parseDateString(value)),
  })
  .strict();

export const updateReleaseTaskDetailSchema = z
  .discriminatedUnion("type", [
    releaseTaskTextDetailSchema,
    releaseTaskDateDetailSchema,
  ])
  .superRefine((input, ctx) => {
    if (RELEASE_TASK_DETAILS[input.taskType]?.type !== input.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["type"],
        message: "This release task does not take this kind of detail",
      });
    }
  });
