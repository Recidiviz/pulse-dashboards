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

import type { GetSignedUrlConfig } from "@google-cloud/storage";
import type { TRPCError } from "@trpc/server";

import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import {
  GCS_ACTION_READ,
  GCS_ACTION_RESUMABLE,
  GCS_ACTION_WRITE,
  GCS_SIGNED_READ_EXPIRY_MS,
  GCS_SIGNED_URL_VERSION,
  GCS_SIGNED_WRITE_EXPIRY_MS,
} from "~@idaho-th/trpc/storage/gcs/gcs.constants";
import type { GenerateSignedUrlInput } from "~@idaho-th/trpc/storage/gcs/gcs.types";
import { getGcsFile } from "~@idaho-th/trpc/storage/gcs/objectStorage.service";
import { serverFaultTrpcError } from "~@idaho-th/trpc/utils/serverFaultTrpcError";

const log = getLogger("gcs.signedUrl");

function signingFailureRemediation(cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return (
    "Could not generate a signed URL for the object in GCS. " +
    "V4 signed URLs require credentials that can sign (a service account with a private key, " +
    "or application-default credentials that impersonate such an account). " +
    `Underlying error: ${detail}. ` +
    "Typical fixes: set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON key with access to this bucket, " +
    "or run `gcloud auth application-default login --impersonate-service-account=YOUR_SA@PROJECT.iam.gserviceaccount.com` " +
    "with roles/iam.serviceAccountTokenCreator on that service account."
  );
}

export function signingFailureTrpcError(cause: unknown): TRPCError {
  log.error("GCS signed URL generation failed", {
    error: cause instanceof Error ? cause.message : String(cause),
    remediation: signingFailureRemediation(cause),
  });

  // A signing failure is a credentials/IAM misconfiguration on our side, so it
  // must reach Sentry even though the client sees PRECONDITION_FAILED.
  return serverFaultTrpcError({
    code: "PRECONDITION_FAILED",
    message: "Unable to generate a download link",
    cause: cause instanceof Error ? cause : undefined,
  });
}

function resolveSignedUrlAction(
  action: GenerateSignedUrlInput["action"],
): GetSignedUrlConfig["action"] {
  switch (action) {
    case "write":
      return GCS_ACTION_WRITE;
    case "resumable":
      return GCS_ACTION_RESUMABLE;
    default:
      return GCS_ACTION_READ;
  }
}

function buildSignedUrlConfig(
  input: GenerateSignedUrlInput,
): GetSignedUrlConfig {
  const isUpload = input.action === "write" || input.action === "resumable";
  const expiresMs =
    input.expiresMs ??
    (isUpload ? GCS_SIGNED_WRITE_EXPIRY_MS : GCS_SIGNED_READ_EXPIRY_MS);

  const config: GetSignedUrlConfig = {
    action: resolveSignedUrlAction(input.action),
    version: GCS_SIGNED_URL_VERSION,
    expires: Date.now() + expiresMs,
  };

  if (isUpload && input.contentType) {
    config.contentType = input.contentType;
  }

  if (input.action === "read" && input.responseDisposition) {
    config.responseDisposition = input.responseDisposition;
  }

  return config;
}

export async function generateSignedUrl(
  input: GenerateSignedUrlInput,
): Promise<string> {
  const file = getGcsFile({
    bucketName: input.bucketName,
    objectKey: input.objectKey,
  });
  const config = buildSignedUrlConfig(input);
  const [signedUrl] = await file.getSignedUrl(config);
  return signedUrl;
}

export async function generateSignedReadUrl(
  input: Omit<GenerateSignedUrlInput, "action">,
): Promise<string> {
  return generateSignedUrl({ ...input, action: "read" });
}

export async function generateResumableUploadUrl(
  input: Omit<GenerateSignedUrlInput, "action">,
): Promise<string> {
  return generateSignedUrl({ ...input, action: "resumable" });
}
