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

import {
  INCARCERATION_OPPORTUNITY_TYPES,
  SUPERVISION_OPPORTUNITY_TYPES,
} from "../../OpportunityConfigs";
import { apiOpportunityConfigurationSchema } from "./ApiOpportunityConfigurationSchema";

export const apiOpportunityConfigurationResponseSchema = z.object({
  enabledConfigs: z.record(
    z.enum([
      SUPERVISION_OPPORTUNITY_TYPES[0], // z.enum requires at least one element
      ...SUPERVISION_OPPORTUNITY_TYPES,
      ...INCARCERATION_OPPORTUNITY_TYPES,
    ]),
    apiOpportunityConfigurationSchema,
  ),
});

//// Keeping this for reference because I don't totally understand its purpose
////
// export const apiOpportunityConfigurationResponseSchema = z.object({
//   enabledConfigs: z.custom<ApiOpportunityConfigurationMap>((data) => {
//     if (typeof data !== "object") return false;
//     const potentialConfigs = data as object;
//     const keys = Object.keys(potentialConfigs);
//     return keys.every(
//       (key) =>
//         // key exists in OPPORTUNITY_CONFIGS
//         key in OPPORTUNITY_CONFIGS &&
//         // value is undefined or valid config
//         ((potentialConfigs as any)[key] === undefined ||
//           apiOpportunityConfigurationSchema.safeParse(
//             (potentialConfigs as any)[key],
//           ).success),
//     );
//   }),
// });
