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

import { fullNameSchema } from "../utils/fullNameSchema";

/**
 * Fields expected for any justice-involved person data
 * regardless of which system compartment they are currently subject to
 */
export const justiceInvolvedPersonRecordSchema = z.object({
  personExternalId: z.string(),
  pseudonymizedId: z.string(),
  displayId: z.string(),
  personName: fullNameSchema,
});

/**
 * Data from the Recidiviz data platform about a justice-involved person
 * (incarcerated or on supervision)
 */
export type JusticeInvolvedPersonRecord = z.infer<
  typeof justiceInvolvedPersonRecordSchema
>;
