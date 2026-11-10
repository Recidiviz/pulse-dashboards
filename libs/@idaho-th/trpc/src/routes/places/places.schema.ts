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

const sessionTokenSchema = z.string().uuid().optional();

export const autocompleteInputSchema = z.object({
  input: z.string().trim().min(1).max(500),
  sessionToken: sessionTokenSchema,
});

export const placeDetailsInputSchema = z.object({
  placeId: z.string().trim().min(1).max(500),
  sessionToken: sessionTokenSchema,
});

export type AutocompleteInput = z.infer<typeof autocompleteInputSchema>;
export type PlaceDetailsInput = z.infer<typeof placeDetailsInputSchema>;
