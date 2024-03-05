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

import { TenantIds } from "../../../../RootStore/types";
import { snoozeConfigurationSchema } from "../modules/SnoozeConfiguration/dtos/SnoozeConfigurationSchema";

// CRITERIA COPY SCHEMA
const copySchema = z.object({
  text: z.string(),
  tooltip: z.string().optional(),
});
const criteriaCopySchema = z.record(copySchema);

export const apiOpportunityConfigurationSchema = z.object({
  stateCode: z.enum(TenantIds),
  urlSection: z.string(),
  displayName: z.string(),
  featureVariant: z.string(),
  dynamicEligibilityText: z.string(),
  callToAction: z.string(),
  firestoreCollection: z.string(),
  snooze: snoozeConfigurationSchema,
  denialReasons: z.record(z.string()),
  eligibleCriteriaCopy: criteriaCopySchema,
  ineligibleCriteriaCopy: criteriaCopySchema,
  sidebarComponents: z.array(z.string()),
  methodologyUrl: z.string().refine(
    (str) => str.startsWith("https://"),
    (str) => ({
      message: `${str.startsWith("http://") ? 'The url is not secure at "http...". Please include an \'s\' at the end of "http"' : 'This url does not begin with "https://"'}`,
    }),
  ),
});
