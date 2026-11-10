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

export {
  ensureGcsStorageInitialized,
  getGcsStorageClient,
} from "~@idaho-th/trpc/storage/gcs/gcs.client";
export {
  assertScanPipelineConfigured,
  type GcsConfig,
  gcsConfig,
  resolveUnscannedUploadBucketName,
} from "~@idaho-th/trpc/storage/gcs/gcs.config";
export {
  GCS_ACTION_READ,
  GCS_ACTION_RESUMABLE,
  GCS_ACTION_WRITE,
  GCS_OBJECT_KEY_REGEX,
  GCS_PDF_CONTENT_TYPE,
  GCS_REQUIRED_ENV_KEYS,
  GCS_SIGNED_READ_EXPIRY_MS,
  GCS_SIGNED_URL_VERSION,
  GCS_SIGNED_WRITE_EXPIRY_MS,
  GCS_VALIDATION_CRC32C,
  MAX_INLINE_READ_BYTES,
} from "~@idaho-th/trpc/storage/gcs/gcs.constants";
export type {
  GcsObjectMetadata,
  GcsObjectMetadataSource,
  GcsObjectRef,
  GcsReadAccessFields,
  GenerateSignedUrlInput,
  ListObjectsInput,
  ResolveGcsReadAccessOptions,
  UploadBufferInput,
} from "~@idaho-th/trpc/storage/gcs/gcs.types";
export {
  type GcsFinalizedEventPayload,
  parseGcsFinalizedEvent,
} from "~@idaho-th/trpc/storage/gcs/gcsFinalizedEvent";
export {
  assertGcsObjectExistence,
  decodeBase64ToBuffer,
  deleteGcsObject,
  downloadBufferFromGcs,
  downloadGcsObjectHead,
  gcsObjectExists,
  getGcsFile,
  getGcsObjectMetadata,
  isGcsNotFoundError,
  listGcsObjects,
  toFiniteNumber,
  toObjectMetadata,
  uploadBufferToGcs,
  upsertBufferInGcs,
} from "~@idaho-th/trpc/storage/gcs/objectStorage.service";
export {
  downloadGcsObjectAsBase64,
  resolveGcsReadAccess,
} from "~@idaho-th/trpc/storage/gcs/readAccess.service";
export {
  generateResumableUploadUrl,
  generateSignedReadUrl,
  generateSignedUrl,
  signingFailureTrpcError,
} from "~@idaho-th/trpc/storage/gcs/signedUrl.service";
