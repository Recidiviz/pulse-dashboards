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

export const specialConditionCodeSchema = z.object({
  condition: z.string(),
  conditionDescription: z.string(),
});

export type SpecialConditionCode = z.infer<typeof specialConditionCodeSchema>;

// TODO(#6300): Handle no name or address in the ClientEmployer component
export const clientEmployerSchema = z
  .object({
    name: z.string(),
    address: z.string(),
  })
  .partial();

export type ClientEmployer = z.infer<typeof clientEmployerSchema>;
