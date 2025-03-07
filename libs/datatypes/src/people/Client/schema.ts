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

import { milestoneSchema } from "../../milestones/schema";
import { milestoneTypes } from "../../milestones/types";
import { dateStringSchema } from "../../utils/zod";
import { workflowsJusticeInvolvedPersonRecordSchema } from "../WorkflowsJusticeInvolvedPerson/schema";
import { clientEmployerSchema, specialConditionCodeSchema } from "./utils";

const optionalClientInformation = z
  .object({
    district: z.string(),
    supervisionType: z.string(),
    supervisionLevel: z.string(),
    supervisionLevelStart: dateStringSchema,
    caseType: z.string(),
    address: z.string(),
    phoneNumber: z.string(),
    supervisionStartDate: dateStringSchema,
    expirationDate: dateStringSchema,
    currentBalance: z.number(),
    lastPaymentAmount: z.number(),
    lastPaymentDate: dateStringSchema,
    specialConditions: z.array(z.string()),
    boardConditions: z.array(specialConditionCodeSchema),
    currentEmployers: z.array(clientEmployerSchema),
    milestones: z
      .array(milestoneSchema)
      .transform((r) =>
        r.flatMap((m) => (milestoneTypes.includes(m.type) ? [m] : [])),
      ),
    emailAddress: z.string(),
  })
  .partial();

export const clientRecordSchema = workflowsJusticeInvolvedPersonRecordSchema
  .merge(
    z.object({
      // the officerId field exists on the justiceInvolvedPersonRecordSchema,
      // however it is required for the Client object, so we redefine the field type here
      officerId: z.string(),
    }),
  )
  .merge(optionalClientInformation)
  .transform((input) => ({
    ...input,
    personType: "CLIENT" as const,
  }));

export type ClientRecord = z.infer<typeof clientRecordSchema>;

export type RawClientRecord = z.input<typeof clientRecordSchema>;
