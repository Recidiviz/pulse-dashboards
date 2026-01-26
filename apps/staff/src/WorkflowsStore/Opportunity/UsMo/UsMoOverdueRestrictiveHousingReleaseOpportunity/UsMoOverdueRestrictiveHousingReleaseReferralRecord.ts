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

import { maxBy } from "lodash";
import { z } from "zod";

import { dateStringSchema } from "~datatypes";

import {
  baseUsMoOverdueRestrictiveHousingSchema,
  usMoNoActiveProgressiveDisciplineSanctions,
} from "../UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingReferralRecord";

const eligibleCriteria =
  baseUsMoOverdueRestrictiveHousingSchema.shape.eligibleCriteria.extend({
    usMoProgressiveDisciplineSanctionAfterMostRecentHearing: z.object({
      latestRestrictiveHousingHearingDate: dateStringSchema.nullable(),
    }),
    usMoProgressiveDisciplineSanctionAfterRestrictiveHousingStart: z.object({
      latestProgressiveDisciplineSanctionStartDate: dateStringSchema,
      restrictiveHousingStartDate: dateStringSchema,
    }),
  });

const ineligibleCriteria =
  baseUsMoOverdueRestrictiveHousingSchema.shape.ineligibleCriteria.extend({
    usMoNoActiveProgressiveDisciplineSanctions,
  });

export const usMoOverdueRestrictiveHousingReleaseSchema =
  baseUsMoOverdueRestrictiveHousingSchema
    .extend({
      eligibleCriteria,
      ineligibleCriteria,
    })
    .transform((record) => {
      if (
        // if the criterion is null, not undefined, the dates should be filled.
        record.eligibleCriteria.usMoNoActiveProgressiveDisciplineSanctions ===
          null ||
        record.ineligibleCriteria.usMoNoActiveProgressiveDisciplineSanctions ===
          null
      ) {
        const { allSanctions } = record.metadata;
        const latestSanction = allSanctions?.length
          ? maxBy(allSanctions, "sanctionStartDate")
          : undefined;

        const rectifiedUsMoNoActiveProgressiveDisciplineSanctions =
          latestSanction
            ? {
                latestSanctionEndDate: latestSanction.sanctionExpirationDate,
                latestSanctionStartDate: latestSanction.sanctionStartDate,
              }
            : null;

        return record.eligibleCriteria
          .usMoNoActiveProgressiveDisciplineSanctions === null
          ? {
              ...record,
              eligibleCriteria: {
                ...record.eligibleCriteria,
                usMoNoActiveProgressiveDisciplineSanctions:
                  rectifiedUsMoNoActiveProgressiveDisciplineSanctions,
              },
            }
          : {
              ...record,
              ineligibleCriteria: {
                ...record.ineligibleCriteria,
                usMoNoActiveProgressiveDisciplineSanctions:
                  rectifiedUsMoNoActiveProgressiveDisciplineSanctions,
              },
            };
      }

      return record;
    });

export type UsMoOverdueRestrictiveHousingReleaseReferralRecord = z.infer<
  typeof usMoOverdueRestrictiveHousingReleaseSchema
>;

export type UsMoOverdueRestrictiveHousingReleaseReferralRecordRaw = z.input<
  typeof usMoOverdueRestrictiveHousingReleaseSchema
>;
