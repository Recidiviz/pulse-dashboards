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

import { dateStringSchema, nullishAsUndefined } from "../../utils/zod";
import { VITALS_METRIC_IDS } from "../utils/constants";

const vitalsMetricForOfficerSchema = z.object({
  officerPseudonymizedId: z.string(),
  metricValue: z.number(),
  metric30DDelta: z.number(),
  // optional for backward compatibility
  // TODO(#8919) remove optional()
  metricDate: dateStringSchema.optional(),
  previousMetricDate: nullishAsUndefined(dateStringSchema),
});

export const supervisionVitalsMetricSchema = z.object({
  metricId: VITALS_METRIC_IDS,
  vitalsMetrics: z.array(vitalsMetricForOfficerSchema),
});

export type SupervisionVitalsMetric = z.infer<
  typeof supervisionVitalsMetricSchema
>;
export type RawSupervisionVitalsMetric = z.input<
  typeof supervisionVitalsMetricSchema
>;
export type VitalsMetricForOfficer = z.infer<
  typeof vitalsMetricForOfficerSchema
>;
