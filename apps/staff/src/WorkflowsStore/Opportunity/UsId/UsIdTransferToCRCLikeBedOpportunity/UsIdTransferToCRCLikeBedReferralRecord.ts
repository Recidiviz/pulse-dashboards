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

import { opportunitySchemaBase } from "~datatypes";

import {
  crcSharedCriteria,
  crcSharedIneligibleCriteria,
} from "../UsIdSharedCriteria";

export const usIdTransferToCRCLikeBedSchema = opportunitySchemaBase.extend({
  eligibleCriteria: crcSharedCriteria.extend({
    custodyLevelIsMinimum: z
      .object({
        custodyLevel: z.string(),
      })
      .nullish(),
  }),
  ineligibleCriteria: crcSharedIneligibleCriteria.passthrough(),
  metadata: z.object({
    criteriaSource: z.string(),
  }),
});

export type UsIdTransferToCRCLikeBedReferralRecord = z.infer<
  typeof usIdTransferToCRCLikeBedSchema
>;
export type UsIdTransferToCRCLikeBedReferralRecordRaw = z.input<
  typeof usIdTransferToCRCLikeBedSchema
>;
