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

const caseloadCategorySchema = z.object({
  // The ID of the caseload category as it appears in the data
  id: z.string(),

  // The caseload category as it should appear in the UI
  displayName: z.string(),
});

export const metricsSchema = z.object({
  name: z.string(),
  outcomeType: z.enum(["FAVORABLE", "ADVERSE"]),
  titleDisplayName: z.string(),
  bodyDisplayName: z.string(),
  eventName: z.string(),
  eventNameSingular: z.string(),
  eventNamePastTense: z.string(),
  descriptionMarkdown: z.string(),
  topXPct: z.number().nullable(),
  listTableText: z
    .string()
    .nullable()
    .transform((x) => x ?? undefined),
});

export const insightsConfigSchema = z.object({
  supervisionOfficerLabel: z.string(),
  supervisionDistrictLabel: z.string(),
  supervisionDistrictManagerLabel: z.string(),
  supervisionJiiLabel: z.string(),
  supervisorHasNoOutlierOfficersLabel: z.string(),
  officerHasNoOutlierMetricsLabel: z.string(),
  supervisorHasNoOfficersWithEligibleClientsLabel: z.string(),
  officerHasNoEligibleClientsLabel: z.string(),
  supervisionSupervisorLabel: z.string(),
  supervisionUnitLabel: z.string(),
  worseThanRateLabel: z.string(),
  slightlyWorseThanRateLabel: z.string(),
  atOrBelowRateLabel: z.string(),
  atOrAboveRateLabel: z.string(),
  noneAreOutliersLabel: z.string(),
  learnMoreUrl: z.string(),
  exclusionReasonDescription: z.string(),
  metrics: z.array(metricsSchema),
  clientEvents: z.array(
    z.object({
      displayName: z.string(),
      name: z.string(),
    }),
  ),
  docLabel: z.string(),
  outliersHover: z.string(),
  caseloadCategories: z.array(caseloadCategorySchema).optional(),
});

export type InsightsConfig = z.infer<typeof insightsConfigSchema>;
export type RawInsightsConfig = z.input<typeof insightsConfigSchema>;
