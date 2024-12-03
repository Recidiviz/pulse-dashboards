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

import { supervisionOfficerMetricOutlierSchema } from "../../../../../metrics/SupervisionOfficerMetricOutlier/schema";

export const supervisionOfficerOutcomesSchema = z.object({
  // The officer's external id
  externalId: z.string(),
  // The officer's pseudo id
  pseudonymizedId: z.string(),
  // The caseload category this officer is part of
  caseloadCategory: z.string(),
  // List of objects that represent what metrics the officer is an Outlier for
  // If the list is empty, then the officer is not an Outlier on any metric.
  outlierMetrics: z.array(supervisionOfficerMetricOutlierSchema),
  // List of objects that represent what metrics the officer is in the top x% for the latest period for,
  // where x can be specified on the OutliersMetricConfig in a state's OutliersBackendConfig
  topXPctMetrics: z.array(
    z.object({
      metricId: z.string(),
      topXPct: z.number(),
    }),
  ),
});

export type SupervisionOfficerOutcomes = z.infer<
  typeof supervisionOfficerOutcomesSchema
>;

export type RawSupervisionOfficerOutcomes = z.input<
  typeof supervisionOfficerOutcomesSchema
>;
