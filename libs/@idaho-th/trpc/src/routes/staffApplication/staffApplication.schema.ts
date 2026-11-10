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
  ApplicationStage,
  ClosedOutcome,
  ParoleCommissionDecision,
} from "~@idaho-th/prisma/client";
import {
  CLOSED_OUTCOME_NOTE_MAX_LENGTH,
  ELIGIBILITY_OVERRIDE_NOTE_MAX_LENGTH,
  RELEASE_DATE_INVALID_ERROR,
} from "~@idaho-th/shared";
import { housingApplicationFormSchema } from "~@idaho-th/trpc/routes/housing-common/housingApplication.form.schema";
import { parseDateString } from "~@idaho-th/trpc/utils/common";

export const createHousingApplicationSchema = z.object({
  formData: housingApplicationFormSchema,
});

export const updateHousingApplicationSchema = z.object({
  id: z.string(),
  data: z.object({
    clientName: z.string().max(500).optional(),
    idocNumber: z.string().max(500).nullable().optional(),
    formData: housingApplicationFormSchema.optional(),
    rawAiResponse: housingApplicationFormSchema.nullable().optional(),
    expectedReleaseDate: z
      .string()
      .nullable()
      .optional()
      .refine(
        (value) =>
          value == null || value === "" || parseDateString(value) !== null,
        {
          message: RELEASE_DATE_INVALID_ERROR,
        },
      ),
    addEligibleProviders: z
      .array(
        z.object({
          providerId: z.string(),
          providerLocationId: z.string(),
          eligibilityOverrideNote: z
            .string()
            .trim()
            .max(ELIGIBILITY_OVERRIDE_NOTE_MAX_LENGTH)
            .optional(),
        }),
      )
      .optional(),
    removeEligibleProviderIds: z.array(z.string()).optional(),
  }),
});

export const advanceApplicationStageSchema = z
  .object({
    applicationId: z.string(),
    targetStage: z.nativeEnum(ApplicationStage),
    closedOutcome: z.nativeEnum(ClosedOutcome).optional(),
    closedOutcomeNote: z
      .string()
      .trim()
      .min(1)
      .max(CLOSED_OUTCOME_NOTE_MAX_LENGTH)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.closedOutcome != null &&
      value.targetStage !== ApplicationStage.CLOSED
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closedOutcome"],
        message: "A closed outcome can only be provided when closing a case",
      });
    }
    if (
      value.closedOutcomeNote != null &&
      value.closedOutcome !== ClosedOutcome.OTHER
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closedOutcomeNote"],
        message: "A note is only allowed with the 'Other' outcome",
      });
    }
  });

export const deleteHousingApplicationSchema = z.object({
  id: z.string(),
});

export const duplicateHousingApplicationSchema = z.object({
  applicationId: z.string(),
});

export const acknowledgeApprovalRevokedSchema = z.object({
  applicationId: z.string(),
});

export const setParoleCommissionDecisionSchema = z
  .object({
    applicationId: z.string(),
    decision: z.nativeEnum(ParoleCommissionDecision),
  })
  .strict();

export const toggleEligibleProviderSelectionSchema = z.object({
  applicationId: z.string(),
  providers: z.array(
    z.object({
      providerId: z.string(),
      isSelected: z.boolean().nullable(),
    }),
  ),
});
