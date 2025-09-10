// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { workflowsJusticeInvolvedPersonRecordSchema } from "../WorkflowsJusticeInvolvedPerson/schema";
import { usArResidentMetadataSchema } from "./US_AR/metadata/schema";
import { usAzResidentMetadataSchema } from "./US_AZ/metadata/schema";
import { usIdResidentMetadataSchema } from "./US_ID/metadata/schema";
import { usMaResidentMetadataSchema } from "./US_MA/metadata/schema";
import { usMeResidentMetadataSchema } from "./US_ME/metadata/schema";
import { usMiResidentMetadataSchema } from "./US_MI/metadata/schema";
import { usMoResidentMetadataSchema } from "./US_MO/metadata/schema";
import { usNdResidentMetadataSchema } from "./US_ND/metadata/schema";
import { usNeResidentMetadataSchema } from "./US_NE/metadata/schema";
import { usTnResidentMetadataSchema } from "./US_TN/metadata/schema";

/**
 * Magic date that appears in data sometimes and is equivalent to null
 */
const MISSING_DATE_SENTINEL = new Date(9999, 11, 1);

/**
 * This is an intermediate schema that should not be included in the public ~datatypes API.
 * It is separated out to support Zod operations on the object schema before transforms are applied
 */
export const residentRecordObjectSchema =
  workflowsJusticeInvolvedPersonRecordSchema.merge(
    z.object({
      facilityId: z.string().nullish(),
      unitId: z.string().nullish(),
      facilityUnitId: z.string().nullish(),
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
      gender: z.string(),
      metadata: personMetadataSchema([
        usArResidentMetadataSchema,
        usAzResidentMetadataSchema,
        usIdResidentMetadataSchema,
        usMeResidentMetadataSchema,
        usMaResidentMetadataSchema,
        usMiResidentMetadataSchema,
        usMoResidentMetadataSchema,
        usNdResidentMetadataSchema,
        usNeResidentMetadataSchema,
        usTnResidentMetadataSchema,
      ]),
    }),
  );
