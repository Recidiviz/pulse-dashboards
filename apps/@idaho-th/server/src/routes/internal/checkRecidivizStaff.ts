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

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { getPrismaClientForStateCode } from "~@idaho-th/prisma";
import { errorLogFields } from "~@idaho-th/server/routes/internal/errorLogFields";
import {
  rejectIfWebhookAuthInvalid,
  rejectIfWebhookRateLimited,
} from "~@idaho-th/server/routes/internal/signedWebhookAuth";
import { registerSignedJsonWebhookParser } from "~@idaho-th/server/routes/internal/signedWebhookJsonParser";
import type { CheckRecidivizStaffSuccessResponse } from "~@idaho-th/trpc/auth/checkRecidivizStaff.schema";
import { checkRecidivizStaffBodySchema } from "~@idaho-th/trpc/auth/checkRecidivizStaff.schema";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import { isProvisionedStaffEmail } from "~@idaho-th/trpc/auth/isProvisionedStaffEmail";
import { checkRecidivizStaffRateLimiter } from "~@idaho-th/trpc/auth/rateLimit";
import {
  checkRecidivizStaffNonceCache,
  SIGNED_WEBHOOK_ROUTES,
} from "~@idaho-th/trpc/auth/webhookSignature";

const WEBHOOK_NAME = "check-recidiviz-staff";

/**
 * Answers whether a Recidiviz address arriving on the passwordless connection
 * has been provisioned as staff.
 *
 * Deliberately separate from check-staff-authorized rather than a branch
 * inside it. That route answers for the staff database connection, where the
 * grant is the allowlist and production depends on exactly that behaviour;
 * this one answers for a connection where the address is supplied by the
 * person signing in, so the grant has to be a row somebody provisioned. Two
 * questions, two routes, so neither can be widened by changing the other.
 *
 * The provider half of the same connection is untouched: a Recidiviz address
 * signing in as a provider still goes through link-provider.
 *
 * A denial is a 403 with no `authorized` field at all, so a caller cannot read
 * an absent or malformed body as permission.
 */
export function registerCheckRecidivizStaffRoute(server: FastifyInstance) {
  server.register(async (instance) => {
    registerSignedJsonWebhookParser(instance);

    instance.post(
      SIGNED_WEBHOOK_ROUTES.checkRecidivizStaff,
      async (req: FastifyRequest, reply: FastifyReply) => {
        // Authenticate before rate limiting: the limiter must not be consumable
        // by unsigned traffic, and its key comes from the verified body.
        if (
          rejectIfWebhookAuthInvalid(req, reply, {
            webhookName: WEBHOOK_NAME,
            route: SIGNED_WEBHOOK_ROUTES.checkRecidivizStaff,
            nonceCache: checkRecidivizStaffNonceCache,
          })
        ) {
          return;
        }

        const parsedBody = checkRecidivizStaffBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
          return reply.code(400).send({ message: "Invalid request body" });
        }

        const { email } = parsedBody.data;

        if (
          rejectIfWebhookRateLimited(
            reply,
            checkRecidivizStaffRateLimiter,
            email.toLowerCase(),
          )
        ) {
          return;
        }

        try {
          const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);

          if (!(await isProvisionedStaffEmail(prisma, email))) {
            req.log.warn({
              webhook: WEBHOOK_NAME,
              reason: "not_provisioned",
            });
            return reply.code(403).send({ message: "Staff not authorized" });
          }

          // No runtime response validation needed: the body is a literal, so
          // the type is the guarantee.
          const responseBody: CheckRecidivizStaffSuccessResponse = {
            authorized: true,
          };
          return reply.code(200).send(responseBody);
        } catch (err) {
          req.log.error(
            {
              webhook: WEBHOOK_NAME,
              reason: "unhandled_error",
              ...errorLogFields(err),
            },
            "Failed to check Recidiviz staff provisioning",
          );
          return reply
            .code(500)
            .send({ message: "An unexpected error occurred" });
        }
      },
    );
  });
}
