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

import "@fastify/jwt";

import { getIsolationScope } from "@sentry/node";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { getPrismaClientForStateCode } from "~@idaho-th/prisma";
import { IDAHO_TH_ACTIVE_PROVIDER_HEADER } from "~@idaho-th/shared";
import {
  IDAHO_TH_STATE_CODE,
  USER_ROLE,
  type UserRole,
} from "~@idaho-th/trpc/auth/constants";
import { parseAuth0User } from "~@idaho-th/trpc/auth/parseAuth0User";
import { parseRequestedProviderId } from "~@idaho-th/trpc/auth/parseRequestedProviderId";
import { verifyAuth0Token } from "~server-setup-plugin";

export type { UserRole };
export { USER_ROLE };

export async function createContext(opts: CreateFastifyContextOptions) {
  const { req, res } = opts;

  // Fastify's request id, not PII — lets a Sentry event be matched to its
  // corresponding structured log lines in Cloud Logging.
  getIsolationScope().setTag("request_id", req.id);

  const authPayload = await verifyAuth0Token(opts);
  const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);
  const requestedProviderId = parseRequestedProviderId(
    req.headers[IDAHO_TH_ACTIVE_PROVIDER_HEADER],
  );

  let role: UserRole | undefined;
  let staffPseudonymizedId: string | undefined;
  let providerPseudonymizedId: string | undefined;

  if (authPayload) {
    const parsedUser = parseAuth0User(authPayload as Record<string, unknown>);

    if (parsedUser) {
      role = parsedUser.role;
      staffPseudonymizedId = parsedUser.staffPseudonymizedId;
      providerPseudonymizedId = parsedUser.providerPseudonymizedId;
    }
  }

  return {
    req,
    res,
    isAuthorized: !!authPayload,
    prisma,
    role,
    staffPseudonymizedId,
    providerPseudonymizedId,
    // UNTRUSTED: the organization the request claims to act as. Parsing only —
    // no database work and no trust decision happens here. The provider
    // middleware in init.ts verifies it against the caller's assignments, which
    // is also why it lives there rather than here: the test caller bypasses
    // this function but runs the middleware.
    requestedProviderId,
  };
}
