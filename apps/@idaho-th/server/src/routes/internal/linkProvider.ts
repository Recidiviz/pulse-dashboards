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
  LINK_PROVIDER_STATUS,
  linkHousingProvider,
} from "~@idaho-th/trpc/auth/linkHousingProvider";
import {
  linkProviderBodySchema,
  linkProviderSuccessResponseSchema,
} from "~@idaho-th/trpc/auth/linkProvider.schema";
import { linkProviderRateLimiter } from "~@idaho-th/trpc/auth/rateLimit";
import {
  linkProviderNonceCache,
  SIGNED_WEBHOOK_ROUTES,
} from "~@idaho-th/trpc/auth/webhookSignature";
import { syncProviderContactBestEffort } from "~@idaho-th/trpc/intercom/intercom.provider.sync";

export function registerLinkProviderRoute(server: FastifyInstance) {
  server.register(async (instance) => {
    registerSignedJsonWebhookParser(instance);

    instance.post(
      SIGNED_WEBHOOK_ROUTES.linkProvider,
      async (req: FastifyRequest, reply: FastifyReply) => {
        if (
          rejectIfWebhookAuthInvalid(req, reply, {
            webhookName: "link-provider",
            route: SIGNED_WEBHOOK_ROUTES.linkProvider,
            nonceCache: linkProviderNonceCache,
          })
        ) {
          return;
        }

        const parsedBody = linkProviderBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
          return reply.code(400).send({ message: "Invalid request body" });
        }

        const { email, auth0Sub, pseudonymizedId } = parsedBody.data;

        if (
          rejectIfWebhookRateLimited(reply, linkProviderRateLimiter, auth0Sub)
        ) {
          return;
        }

        const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);

        try {
          const result = await linkHousingProvider(prisma, {
            email,
            auth0Sub,
            pseudonymizedId,
          });

          switch (result.status) {
            case LINK_PROVIDER_STATUS.NOT_FOUND:
              req.log.warn({ webhook: "link-provider", reason: "not_found" });
              return reply.code(404).send({ message: "Provider not found" });
            case LINK_PROVIDER_STATUS.CONFLICT:
              req.log.warn({
                webhook: "link-provider",
                reason: "identity_conflict",
                providerUserId: result.providerUserId,
              });
              return reply.code(409).send({
                message: "Provider already linked to another account",
              });
            case LINK_PROVIDER_STATUS.LINKED:
            case LINK_PROVIDER_STATUS.ALREADY_LINKED: {
              // Keyed on the person: the Intercom contact carries their own
              // name and email, not any organization's.
              const intercomResult = await syncProviderContactBestEffort({
                prisma,
                providerUserId: result.providerUserId,
                provider: {
                  email: result.email,
                  name: result.name,
                  intercomSyncedAt: result.intercomSyncedAt,
                },
              });
              if (intercomResult.status === "failed") {
                req.log.warn({
                  webhook: "link-provider",
                  reason: "intercom_sync_failed",
                  providerUserId: result.providerUserId,
                  // Code only — the raw message may carry Intercom API detail.
                  ...(intercomResult.code
                    ? { cause: intercomResult.code }
                    : {}),
                });
              } else if (
                intercomResult.status === "disabled" ||
                intercomResult.status === "ineligible"
              ) {
                req.log.info({
                  webhook: "link-provider",
                  status: intercomResult.status,
                  providerUserId: result.providerUserId,
                });
              } else {
                req.log.info({
                  webhook: "link-provider",
                  status: result.status,
                  intercomStatus: intercomResult.status,
                  providerUserId: result.providerUserId,
                });
              }

              const responseBody = {
                success: true as const,
                pseudonymizedId: result.pseudonymizedId,
              };
              const parsedResponse =
                linkProviderSuccessResponseSchema.safeParse(responseBody);
              if (!parsedResponse.success) {
                req.log.error({
                  webhook: "link-provider",
                  reason: "invalid_canonical_pseudonymized_id",
                  providerUserId: result.providerUserId,
                });
                return reply
                  .code(500)
                  .send({ message: "An unexpected error occurred" });
              }
              return reply.code(200).send(parsedResponse.data);
            }
          }
        } catch (err) {
          req.log.error(
            {
              webhook: "link-provider",
              reason: "unhandled_error",
              ...errorLogFields(err),
            },
            "Failed to link housing provider",
          );
          return reply
            .code(500)
            .send({ message: "An unexpected error occurred" });
        }
      },
    );
  });
}
