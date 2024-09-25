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
import { nullishAsUndefined } from "../../schemaHelpers";
import { snoozeConfigurationSchema } from "../modules/SnoozeConfiguration/dtos/SnoozeConfigurationSchema";

// CRITERIA COPY SCHEMA
const copySchema = z.object({
  text: z.string(),
  tooltip: z.string().optional(),
});
const criteriaCopySchema = z.record(copySchema);

export const apiOpportunityConfigurationSchema = z.object({
  stateCode: z.enum(TenantIds),
  systemType: z.enum(["SUPERVISION", "INCARCERATION"]),
  urlSection: z.string(),
  displayName: z.string(),
  featureVariant: nullishAsUndefined(z.string()),
  inverseFeatureVariant: nullishAsUndefined(z.string()),
  priority: nullishAsUndefined(z.enum(["HIGH", "NORMAL"])).default("NORMAL"),
  dynamicEligibilityText: z.string(),
  callToAction: z.string(),
  subheading: nullishAsUndefined(z.string()),
  notifications: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        body: z.string(),
        cta: z.string().optional(),
      }),
    )
    .nullish()
    .transform((r) => r ?? []),
  firestoreCollection: z.string(),
  snooze: nullishAsUndefined(snoozeConfigurationSchema),
  denialReasons: z.record(z.string()),
  tabGroups: nullishAsUndefined(z.record(z.string(), z.array(z.string()))),
  initialHeader: nullishAsUndefined(z.string()),
  denialText: nullishAsUndefined(z.string()),
  eligibilityDateText: nullishAsUndefined(z.string()),
  tooltipEligibilityText: nullishAsUndefined(z.string()),
  hideDenialRevert: z.boolean().optional(),
  eligibleCriteriaCopy: criteriaCopySchema,
  ineligibleCriteriaCopy: criteriaCopySchema,
  sidebarComponents: z.array(z.string()),
  isAlert: z.boolean(),
  compareBy: nullishAsUndefined(
    z.array(
      z.object({
        field: z.string(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
        undefinedBehavior: z
          .enum(["undefinedFirst", "undefinedLast"])
          .optional(),
      }),
    ),
  ),
  homepagePosition: z.number(),
  methodologyUrl: z.string(),
});

export const apiOpportunityConfigurationResponseSchema = z.object({
  enabledConfigs: z.record(apiOpportunityConfigurationSchema),
});
