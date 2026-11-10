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

import { WEBHOOK_FIELD } from "~@idaho-th/trpc/auth/signedWebhook.schema";

export const checkRecidivizStaffBodySchema = z.object({
  email: WEBHOOK_FIELD.email,
});

/**
 * Only ever `authorized: true`. An address with no provisioned row gets a 403
 * carrying no body of this shape, so the Action cannot read an absent or
 * malformed field as permission.
 */
export const checkRecidivizStaffSuccessResponseSchema = z.object({
  authorized: WEBHOOK_FIELD.authorized,
});

export type CheckRecidivizStaffBody = z.infer<
  typeof checkRecidivizStaffBodySchema
>;
export type CheckRecidivizStaffSuccessResponse = z.infer<
  typeof checkRecidivizStaffSuccessResponseSchema
>;
