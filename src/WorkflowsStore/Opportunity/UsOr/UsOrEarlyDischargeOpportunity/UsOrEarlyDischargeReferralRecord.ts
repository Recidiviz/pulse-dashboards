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

export const usOrEarlyDischargeSchema = z.object({
  stateCode: z.string(),
  externalId: z.string(),
  formInformation: z.object({}),
  eligibleCriteria: z.object({}),
  ineligibleCriteria: z.object({}),
});

export type UsOrEarlyDischargeReferralRecordRaw = z.input<
  typeof usOrEarlyDischargeSchema
>;

export type UsOrEarlyDischargeReferralRecord = z.infer<
  typeof usOrEarlyDischargeSchema
>;
