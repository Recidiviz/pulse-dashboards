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

import { TRPCError } from "@trpc/server";

import {
  getOptionalEnv,
  getRequiredEnv,
} from "~@idaho-th/trpc/routes/common/env";
import { serverConfig } from "~@idaho-th/trpc/routes/common/serverConfig";

export type GcsConfig = {
  projectId: string;
  bucketName: string;
  cleanBucketName: string;
  quarantinedBucketName?: string;
  nodeEnv: string;
  isProduction: boolean;
  dedicatedKeyFilename?: string;
  impersonateTarget?: string;
  impersonationSourceKeyFilename?: string;
  skipDocumentScan: boolean;
  malwareScanEnabled: boolean;
};

export const GCS_IMPERSONATION_SOURCE_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
] as const;

export const GCS_IMPERSONATION_TARGET_SCOPES = [
  "https://www.googleapis.com/auth/devstorage.full_control",
] as const;

export const GCS_IMPERSONATION_TOKEN_LIFETIME_SECONDS = 3600;

const bucketName = getRequiredEnv("IDAHO_TH_PDF_GCS_BUCKET", { label: "GCS" });

const cleanBucketName =
  getOptionalEnv("IDAHO_TH_PDF_GCS_CLEAN_BUCKET") ?? bucketName;

const skipDocumentScan =
  serverConfig.isDevelopment &&
  getOptionalEnv("IDAHO_TH_SKIP_DOCUMENT_SCAN") === "true";

const malwareScanEnabled =
  getOptionalEnv("IDAHO_TH_MALWARE_SCAN_ENABLED") === "true";

export const gcsConfig: GcsConfig = {
  projectId: getRequiredEnv("GOOGLE_PROJECT_ID", { label: "GCS" }),
  bucketName,
  cleanBucketName,
  quarantinedBucketName: getOptionalEnv("IDAHO_TH_PDF_GCS_QUARANTINED_BUCKET"),
  nodeEnv: serverConfig.nodeEnv,
  isProduction: serverConfig.isProduction,
  dedicatedKeyFilename: getOptionalEnv(
    "IDAHO_TH_GCS_GOOGLE_APPLICATION_CREDENTIALS",
  ),
  impersonateTarget: getOptionalEnv("IDAHO_TH_GCS_IMPERSONATE_SERVICE_ACCOUNT"),
  impersonationSourceKeyFilename: getOptionalEnv(
    "IDAHO_TH_GCS_IMPERSONATION_SOURCE_KEY_FILE",
  ),
  skipDocumentScan,
  malwareScanEnabled,
};

export function assertScanPipelineConfigured(): void {
  if (
    gcsConfig.malwareScanEnabled &&
    gcsConfig.cleanBucketName === gcsConfig.bucketName &&
    !gcsConfig.skipDocumentScan
  ) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "IDAHO_TH_PDF_GCS_CLEAN_BUCKET must be set to a bucket distinct " +
        "from IDAHO_TH_PDF_GCS_BUCKET while IDAHO_TH_MALWARE_SCAN_ENABLED " +
        "is true — otherwise uploads self-certify as malware-scanned clean.",
    });
  }
}

export function resolveUnscannedUploadBucketName(): string {
  return gcsConfig.bucketName;
}
