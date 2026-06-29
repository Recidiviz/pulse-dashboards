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

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";

const supervisionPastFullTermCompletionDate = z
  .object({ eligibleDate: dateStringSchema })
  .optional();

const ineligibleAndEligibleCriteria = z
  .object({ supervisionPastFullTermCompletionDate })
  .passthrough();

export const usIdPastFTRDSchema = opportunitySchemaBase.extend({
  eligibleCriteria: ineligibleAndEligibleCriteria,
  ineligibleCriteria: ineligibleAndEligibleCriteria,
  metadata: z
    .object({
      tabName: z.string().optional(),
    })
    .passthrough()
    .default({}),
});

export type UsIdPastFTRDRecord = ParsedRecord<typeof usIdPastFTRDSchema>;
