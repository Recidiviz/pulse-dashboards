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
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import {
  linkStaffBodySchema,
  linkStaffSuccessResponseSchema,
} from "~@idaho-th/trpc/auth/linkStaff.schema";
import { linkStaffRateLimiter } from "~@idaho-th/trpc/auth/rateLimit";
import {
  linkStaffNonceCache,
  SIGNED_WEBHOOK_ROUTES,
} from "~@idaho-th/trpc/auth/webhookSignature";
import { upsertStaffAndSyncIntercom } from "~@idaho-th/trpc/intercom/intercom.staff.sync";

export function registerLinkStaffRoute(server: FastifyInstance) {
  server.register(async (instance) => {
    registerSignedJsonWebhookParser(instance);

    instance.post(
      SIGNED_WEBHOOK_ROUTES.linkStaff,
      async (req: FastifyRequest, reply: FastifyReply) => {
        if (
          rejectIfWebhookAuthInvalid(req, reply, {
            webhookName: "link-staff",
            route: SIGNED_WEBHOOK_ROUTES.linkStaff,
            nonceCache: linkStaffNonceCache,
          })
        ) {
          return;
        }

        const parsedBody = linkStaffBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
          return reply.code(400).send({ message: "Invalid request body" });
        }

        const { email, auth0Sub, pseudonymizedId } = parsedBody.data;

        if (rejectIfWebhookRateLimited(reply, linkStaffRateLimiter, auth0Sub)) {
          return;
        }

        const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);

        try {
          const result = await upsertStaffAndSyncIntercom({
            prisma,
            email,
            pseudonymizedId,
          });

          if (result.status === "conflict") {
            req.log.warn({
              webhook: "link-staff",
              reason: "identity_conflict",
            });
            return reply.code(409).send({
              message: "Staff email already linked to another account",
            });
          }

          // Intercom disabled/failed still returns 200 — login must not block.
          if (result.status === "failed") {
            req.log.warn({
              webhook: "link-staff",
              reason: "intercom_sync_failed",
              staffId: result.staffId,
            });
          } else if (result.status === "disabled") {
            req.log.info({
              webhook: "link-staff",
              status: "disabled",
              staffId: result.staffId,
            });
          } else {
            req.log.info({
              webhook: "link-staff",
              status: result.status,
              staffId: result.staffId,
              ...(result.pseudonymizedId !== pseudonymizedId
                ? { adoptedExistingIdentity: true }
                : {}),
            });
          }

          const responseBody = {
            success: true as const,
            pseudonymizedId: result.pseudonymizedId,
          };
          const parsedResponse =
            linkStaffSuccessResponseSchema.safeParse(responseBody);
          if (!parsedResponse.success) {
            req.log.error({
              webhook: "link-staff",
              reason: "invalid_response",
              staffId: result.staffId,
            });
            return reply
              .code(500)
              .send({ message: "An unexpected error occurred" });
          }
          return reply.code(200).send(parsedResponse.data);
        } catch (err) {
          req.log.error(
            {
              webhook: "link-staff",
              reason: "unhandled_error",
              ...errorLogFields(err),
            },
            "Failed to link housing staff",
          );
          return reply
            .code(500)
            .send({ message: "An unexpected error occurred" });
        }
      },
    );
  });
}
