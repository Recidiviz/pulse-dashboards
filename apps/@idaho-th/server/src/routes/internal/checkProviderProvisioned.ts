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
import type { CheckProviderProvisionedSuccessResponse } from "~@idaho-th/trpc/auth/checkProviderProvisioned.schema";
import { checkProviderProvisionedBodySchema } from "~@idaho-th/trpc/auth/checkProviderProvisioned.schema";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import { isProvisionedProviderEmail } from "~@idaho-th/trpc/auth/isProvisionedProviderEmail";
import { checkProviderProvisionedRateLimiter } from "~@idaho-th/trpc/auth/rateLimit";
import {
  checkProviderProvisionedNonceCache,
  SIGNED_WEBHOOK_ROUTES,
} from "~@idaho-th/trpc/auth/webhookSignature";

export function registerCheckProviderProvisionedRoute(server: FastifyInstance) {
  server.register(async (instance) => {
    registerSignedJsonWebhookParser(instance);

    instance.post(
      SIGNED_WEBHOOK_ROUTES.checkProviderProvisioned,
      async (req: FastifyRequest, reply: FastifyReply) => {
        // Authenticate before rate limiting: the limiter must not be consumable
        // by unsigned traffic, and its key comes from the verified body.
        if (
          rejectIfWebhookAuthInvalid(req, reply, {
            webhookName: "check-provider-provisioned",
            route: SIGNED_WEBHOOK_ROUTES.checkProviderProvisioned,
            nonceCache: checkProviderProvisionedNonceCache,
          })
        ) {
          return;
        }

        const parsedBody = checkProviderProvisionedBodySchema.safeParse(
          req.body,
        );
        if (!parsedBody.success) {
          return reply.code(400).send({ message: "Invalid request body" });
        }

        const { email } = parsedBody.data;

        if (
          rejectIfWebhookRateLimited(
            reply,
            checkProviderProvisionedRateLimiter,
            email.toLowerCase(),
          )
        ) {
          return;
        }

        const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);

        try {
          const provisioned = await isProvisionedProviderEmail(prisma, email);
          if (!provisioned) {
            req.log.warn({
              webhook: "check-provider-provisioned",
              reason: "not_found",
            });
            return reply.code(404).send({ message: "Provider not found" });
          }

          // No runtime response validation needed: unlike link-provider, the
          // body is a literal, so the type is the guarantee.
          const responseBody: CheckProviderProvisionedSuccessResponse = {
            success: true,
          };
          return reply.code(200).send(responseBody);
        } catch (err) {
          req.log.error(
            {
              webhook: "check-provider-provisioned",
              reason: "unhandled_error",
              ...errorLogFields(err),
            },
            "Failed to check provider provisioned status",
          );
          return reply
            .code(500)
            .send({ message: "An unexpected error occurred" });
        }
      },
    );
  });
}
