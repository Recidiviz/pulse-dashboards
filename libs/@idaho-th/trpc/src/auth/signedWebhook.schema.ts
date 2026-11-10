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

/**
 * Upper bounds for the webhook string fields. The route `bodyLimit` is 10 MB,
 * so without these a multi-megabyte `auth0Sub` validates and reaches a
 * `String` column. 254 is the RFC 5321 maximum for an address; the identifier
 * caps sit well above any value Auth0 issues.
 */
const WEBHOOK_FIELD_MAX_LENGTH = {
  email: 254,
  auth0Sub: 255,
  pseudonymizedId: 255,
} as const;

/**
 * Field validators shared by the Auth0 Action webhook contracts
 * (`link-provider`, `link-staff`, `check-provider-provisioned`).
 *
 * Deliberately field-level rather than whole-schema: each route keeps its own
 * named body/response schema so the three contracts can diverge, while the
 * validation rules stay defined once. Tightening `email` here tightens it on
 * every webhook, which is the property worth having.
 *
 * Zod schemas are immutable — every builder method returns a new instance — so
 * sharing these across schemas is safe.
 */
export const WEBHOOK_FIELD = {
  email: z.string().trim().email().max(WEBHOOK_FIELD_MAX_LENGTH.email),
  auth0Sub: z.string().trim().min(1).max(WEBHOOK_FIELD_MAX_LENGTH.auth0Sub),
  pseudonymizedId: z
    .string()
    .trim()
    .min(1)
    .max(WEBHOOK_FIELD_MAX_LENGTH.pseudonymizedId),
  /** Success responses are a literal `true`, never a truthy value. */
  success: z.literal(true),
  /** Same rule for an authorization answer: only an explicit `true` grants. */
  authorized: z.literal(true),
} as const;
