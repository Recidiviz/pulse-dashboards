// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { Equal, Expect } from "../../../../utils/typeUtils";
import {
  BasePastFTRDReferralRecord,
  basePastFTRDSchema,
} from "../../PastFTRDReferralRecord";
import { eligibleDateSchema } from "../../schemaHelpers";

const eligibleCriteria = z
  .object({
    supervisionOneDayPastFullTermCompletionDate: eligibleDateSchema,
  })
  .transform((data) => {
    const {
      supervisionOneDayPastFullTermCompletionDate,
      ...restEligibleCriteria
    } = data;

    return {
      ...restEligibleCriteria,
      supervisionPastFullTermCompletionDate:
        supervisionOneDayPastFullTermCompletionDate,
    };
  });

const ineligibleCriteria = z.object({});

export const usMiPastFTRDSchema = basePastFTRDSchema.extend({
  eligibleCriteria,
  ineligibleCriteria,
});

export type UsMiPastFTRDReferralRecord = z.infer<typeof usMiPastFTRDSchema>;
export type UsMiPastFTRDReferralRecordRaw = z.input<typeof usMiPastFTRDSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type VerifyEquivalenceToBase = Expect<
  Equal<
    UsMiPastFTRDReferralRecord["eligibleCriteria"],
    Required<BasePastFTRDReferralRecord["eligibleCriteria"]>
  >
>;
