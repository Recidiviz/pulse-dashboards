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

import { SIGN_IN_FLOW } from "~@idaho-th/shared";

export const checkSignInEmailInputSchema = z.object({
  email: z.string().email(),
  // These are the two chips on the role chooser, which is offered to
  // @recidiviz.org addresses only. STAFF_SSO is the wire value behind "Case
  // Manager" and is not a request for the IDOC connection: the router honours
  // either value only for a Recidiviz address, and routes that address to
  // STAFF_DATABASE.
  requestedFlow: z
    .enum([SIGN_IN_FLOW.STAFF_SSO, SIGN_IN_FLOW.PROVIDER])
    .optional(),
});

export const checkRecidivizRoleChoiceInputSchema = z.object({
  email: z.string().email(),
});
