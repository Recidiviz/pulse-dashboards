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

import { errorLogFields } from "~@idaho-th/server/routes/internal/errorLogFields";
import {
  rejectIfWebhookAuthInvalid,
  rejectIfWebhookRateLimited,
} from "~@idaho-th/server/routes/internal/signedWebhookAuth";
import { registerSignedJsonWebhookParser } from "~@idaho-th/server/routes/internal/signedWebhookJsonParser";
import type { CheckStaffAuthorizedSuccessResponse } from "~@idaho-th/trpc/auth/checkStaffAuthorized.schema";
import { checkStaffAuthorizedBodySchema } from "~@idaho-th/trpc/auth/checkStaffAuthorized.schema";
import { isRecidivizStaffAuthorized } from "~@idaho-th/trpc/auth/isRecidivizStaffAuthorized";
import { checkStaffAuthorizedRateLimiter } from "~@idaho-th/trpc/auth/rateLimit";
import {
  checkStaffAuthorizedNonceCache,
  SIGNED_WEBHOOK_ROUTES,
} from "~@idaho-th/trpc/auth/webhookSignature";

const WEBHOOK_NAME = "check-staff-authorized";

/**
 * Answers the Auth0 staff Action's question: may this person into Idaho TH?
 *
 * Asked only for Recidiviz logins — the route name is the general seam, but
 * the only grant it knows about today is theirs. IDOC staff are authorized by
 * the Admin Panel roster, which the Action reads directly, so they never
 * reach here and would be refused if they did.
 *
 * Deliberately separate from link-staff rather than folded into its response.
 * That call records that someone logged in and its body is never read by the
 * Action, by design — mixing an authorization answer into it would put a
 * decision in a response that is supposed to be ignored.
 *
 * A denial is a 403 with no `authorized` field at all, so a caller cannot read
 * an absent or malformed body as permission.
 */
export function registerCheckStaffAuthorizedRoute(server: FastifyInstance) {
  server.register(async (instance) => {
    registerSignedJsonWebhookParser(instance);

    instance.post(
      SIGNED_WEBHOOK_ROUTES.checkStaffAuthorized,
      async (req: FastifyRequest, reply: FastifyReply) => {
        // Authenticate before rate limiting: the limiter must not be consumable
        // by unsigned traffic, and its key comes from the verified body.
        if (
          rejectIfWebhookAuthInvalid(req, reply, {
            webhookName: WEBHOOK_NAME,
            route: SIGNED_WEBHOOK_ROUTES.checkStaffAuthorized,
            nonceCache: checkStaffAuthorizedNonceCache,
          })
        ) {
          return;
        }

        const parsedBody = checkStaffAuthorizedBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
          return reply.code(400).send({ message: "Invalid request body" });
        }

        const { email } = parsedBody.data;

        if (
          rejectIfWebhookRateLimited(
            reply,
            checkStaffAuthorizedRateLimiter,
            email.toLowerCase(),
          )
        ) {
          return;
        }

        try {
          if (!isRecidivizStaffAuthorized(email)) {
            req.log.warn({
              webhook: WEBHOOK_NAME,
              reason: "not_authorized",
            });
            return reply.code(403).send({ message: "Staff not authorized" });
          }

          // No runtime response validation needed: the body is a literal, so
          // the type is the guarantee.
          const responseBody: CheckStaffAuthorizedSuccessResponse = {
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
            "Failed to check staff authorization",
          );
          return reply
            .code(500)
            .send({ message: "An unexpected error occurred" });
        }
      },
    );
  });
}
