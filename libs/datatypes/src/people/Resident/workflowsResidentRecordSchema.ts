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

import { isEqual } from "date-fns";
import { z } from "zod";

import { usMeXPortionServedEnum } from "../../opportunities/UsMe/UsMeSCCP/schema";
import { dateStringSchema, nullishAsUndefined } from "../../utils/zod";
import { personMetadataSchema } from "../utils/personMetadataSchema";
import { workflowsJusticeInvolvedPersonMixinSchema } from "../WorkflowsJusticeInvolvedPerson/schema";
import { residentCommonSchema } from "./residentCommonSchema";
import { stateMetadataSchemas } from "./stateMetadataSchemas";

/**
 * Magic date that appears in data sometimes and is equivalent to null
 */
const MISSING_DATE_SENTINEL = new Date(9999, 11, 1);

export const workflowsResidentRecordSchema = residentCommonSchema
  .extend({
    facilityUnitId: z.string().nullish(),
    officerId: z.string().nullish(),
    custodyLevel: z.string().nullish(),
    admissionDate: nullishAsUndefined(dateStringSchema),
    releaseDate: nullishAsUndefined(dateStringSchema).transform((d) => {
      if (d && isEqual(d, MISSING_DATE_SENTINEL)) {
        return undefined;
      }
      return d;
    }),
    portionServedNeeded: usMeXPortionServedEnum.nullish(),
    sccpEligibilityDate: dateStringSchema.nullish(),
    usTnFacilityAdmissionDate: nullishAsUndefined(dateStringSchema),
    usMePortionNeededEligibleDate: dateStringSchema.nullish(),
    gender: nullishAsUndefined(z.string()),
    metadata: personMetadataSchema([...stateMetadataSchemas]),
  })
  .merge(workflowsJusticeInvolvedPersonMixinSchema)
  .transform((input) => ({
    ...input,
    personType: "RESIDENT" as const,
  }));

/**
 * Data from the Recidiviz data platform about an incarcerated person
 */
export type WorkflowsResidentRecord = z.infer<
  typeof workflowsResidentRecordSchema
>;
/**
 * A Resident record in its raw form, as stored in Firestore
 */
export type RawWorkflowsResidentRecord = z.input<
  typeof workflowsResidentRecordSchema
>;

export type WorkflowsResidentMetadata<S> =
  WorkflowsResidentRecord["metadata"] & { stateCode: S };
