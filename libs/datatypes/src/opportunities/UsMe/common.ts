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

import { z } from "zod";

import { dateStringSchema } from "../../utils/zod";

export const noDetainersWarrantsSchema = {
  eligible: {
    usMeNoDetainersWarrantsOrOther: z.null(),
  },
  ineligible: {
    usMeNoDetainersWarrantsOrOther: z.object({
      detainer: z.string(),
      detainerStartDate: dateStringSchema,
    }),
  },
};

export const noABViolation90DaysSchema = {
  eligible: { usMeNoClassAOrBViolationFor90Days: z.null() },
  ineligible: {
    usMeNoClassAOrBViolationFor90Days: z.object({
      eligibleDate: dateStringSchema.nullable(),
      highestClassViol: z.string(),
      violType: z.string(),
    }),
  },
};

export const eligibleDateReasonSchema = z.object({
  eligibleDate: dateStringSchema,
});

export const nullableEligibleDateReasonSchema = z
  .object({
    eligibleDate: dateStringSchema.nullable(),
  })
  .nullable();

export function eligibleDateReason<C extends string>(criterionId: C) {
  return <
    {
      eligible: Record<C, typeof eligibleDateReasonSchema>;
      ineligible: Record<C, typeof nullableEligibleDateReasonSchema>;
    }
  >{
    eligible: {
      [criterionId]: eligibleDateReasonSchema,
    },
    ineligible: {
      [criterionId]: nullableEligibleDateReasonSchema,
    },
  };
}

export function custodyLevelReason<C extends string>(criterionId: C) {
  const reason = z.object({
    custodyLevel: z.string(),
  });

  return <
    {
      eligible: Record<C, typeof reason>;
      ineligible: Record<C, ReturnType<typeof reason.nullable>>;
    }
  >{
    eligible: { [criterionId]: reason },
    ineligible: { [criterionId]: reason.nullable() },
  };
}
