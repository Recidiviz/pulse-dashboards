// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

export const rosterChangeRequestSchema = z.object({
  requesterName: z.string().min(1, "Requester name is required."),
  affectedOfficersExternalIds: z
    .array(z.string())
    .min(1, "Must have at least one officer."),
  requestChangeType: z.enum(["ADD", "REMOVE"]),
  requestNote: z.string().min(1, "Request note cannot be empty."),
});

export type RosterChangeRequest = z.infer<typeof rosterChangeRequestSchema>;
export type RawRosterChangeRequest = z.input<typeof rosterChangeRequestSchema>;

export const rosterChangeRequestResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
});

export type RosterChangeRequestResponse = z.infer<
  typeof rosterChangeRequestResponseSchema
>;
export type RawRosterChangeRequestResponse = z.input<
  typeof rosterChangeRequestResponseSchema
>;
