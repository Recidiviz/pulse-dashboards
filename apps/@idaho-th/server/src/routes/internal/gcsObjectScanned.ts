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
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import { verifyGcsScanWebhookToken } from "~@idaho-th/trpc/auth/verifyGcsScanWebhookToken";
import { getOptionalEnv } from "~@idaho-th/trpc/routes/common/env";
import { documentScanResultBodySchema } from "~@idaho-th/trpc/routes/documents/documents.schema";
import {
  applyDocumentScanResult,
  deriveVerdictFromBucket,
  isCleanBucketWithScanDisabled,
} from "~@idaho-th/trpc/routes/documents/documents.service";
import { parseGcsFinalizedEvent } from "~@idaho-th/trpc/storage/gcs/gcsFinalizedEvent";

export function registerGcsObjectScannedRoute(server: FastifyInstance) {
  // Read at registration time (like the rest of the stack's env config) so a
  // missing var fails at startup instead of on the first webhook call. The
  // webhook is GCP-configured infra that isn't provisioned in every dev
  // environment yet, so treat it as optional and disable the route rather
  // than block server startup when it's unset.
  const audience = getOptionalEnv("IDAHO_TH_SCAN_WEBHOOK_AUDIENCE_URL");
  const expectedInvokerEmail = getOptionalEnv(
    "IDAHO_TH_SCAN_WEBHOOK_INVOKER_EMAIL",
  );

  if (!audience || !expectedInvokerEmail) {
    server.log.warn(
      "gcs-object-scanned webhook disabled: IDAHO_TH_SCAN_WEBHOOK_AUDIENCE_URL / IDAHO_TH_SCAN_WEBHOOK_INVOKER_EMAIL not set",
    );
    return;
  }

  server.post(
    "/internal/gcs-object-scanned",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const authResult = await verifyGcsScanWebhookToken({
          authorizationHeader: req.headers.authorization,
          audience,
          expectedInvokerEmail,
        });
        if (!authResult.valid) {
          req.log.warn({
            webhook: "gcs-object-scanned",
            reason: authResult.reason,
          });
          return reply.code(401).send();
        }

        // Eventarc delivers a CloudEvent, not the flat {bucketName, objectKey,
        // verdict} shape below — detect that and translate it. The verdict
        // is never read off the event itself (GCS has no concept of a scan
        // verdict); it's derived from which bucket the finalize event fired
        // in, since ClamAV is what moves the object into a clean/quarantine
        // bucket. Any other request body (e.g. a manual/test call) is passed
        // through as-is and must supply bucketName/objectKey/verdict itself.
        let candidateBody: unknown = req.body;
        const gcsEvent = parseGcsFinalizedEvent(req.headers, req.body);
        if (gcsEvent) {
          const verdict = deriveVerdictFromBucket(gcsEvent.bucket);
          if (!verdict) {
            // With the scan flag off, clean-bucket events are plain uploads,
            // not scan results, so they get their own reason.
            const scanDisabled = isCleanBucketWithScanDisabled(gcsEvent.bucket);
            const fields = {
              webhook: "gcs-object-scanned",
              reason: scanDisabled
                ? "ignored_malware_scan_disabled"
                : "ignored_unrecognized_bucket",
              bucketName: gcsEvent.bucket,
              objectKey: gcsEvent.name,
            };
            if (scanDisabled) {
              req.log.warn(fields);
            } else {
              req.log.info(fields);
            }
            return reply.code(200).send({ success: true, ignored: true });
          }
          candidateBody = {
            bucketName: gcsEvent.bucket,
            objectKey: gcsEvent.name,
            verdict,
          };
        }

        const parsedBody =
          documentScanResultBodySchema.safeParse(candidateBody);
        if (!parsedBody.success) {
          return reply.code(400).send({ message: "Invalid request body" });
        }

        const prisma = getPrismaClientForStateCode(IDAHO_TH_STATE_CODE);
        const outcome = await applyDocumentScanResult(prisma, parsedBody.data);

        if (outcome === "not_found") {
          req.log.info({
            webhook: "gcs-object-scanned",
            verdict: parsedBody.data.verdict,
            outcome,
            bucketName: parsedBody.data.bucketName,
            objectKey: parsedBody.data.objectKey,
          });
          return reply.code(200).send({ success: true, ignored: true });
        }

        req.log.info({
          webhook: "gcs-object-scanned",
          verdict: parsedBody.data.verdict,
          outcome,
        });
        return reply.code(200).send({ success: true });
      } catch (err) {
        req.log.error(
          {
            webhook: "gcs-object-scanned",
            reason: "unhandled_error",
            ...errorLogFields(err),
          },
          "Failed to apply document scan result",
        );
        return reply
          .code(500)
          .send({ message: "An unexpected error occurred" });
      }
    },
  );
}
