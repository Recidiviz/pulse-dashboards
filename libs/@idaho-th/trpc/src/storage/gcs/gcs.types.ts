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

import type { GCS_VALIDATION_CRC32C } from "~@idaho-th/trpc/storage/gcs/gcs.constants";

export type GcsObjectRef = {
  bucketName: string;
  objectKey: string;
};

export type GcsObjectMetadataSource = {
  contentType?: string;
  size?: string | number;
  updated?: string | Date;
};

export type GcsObjectMetadata = {
  objectKey: string;
  bucketName: string;
  contentType: string;
  sizeInBytes?: number;
  updatedAt?: string;
};

export type GcsReadAccessFields = {
  signedUrl: string | null;
  contentBase64: string | null;
};

export type ResolveGcsReadAccessOptions = {
  devInlineReadFallback?: boolean;
  fileMetadata?: GcsObjectMetadataSource;
  maxInlineBytes?: number;
  expiresMs?: number;
  responseDisposition?: string;
};

export type UploadBufferInput = {
  bucketName: string;
  objectKey: string;
  buffer: Buffer;
  contentType: string;
  validation?: typeof GCS_VALIDATION_CRC32C | false;
};

export type GenerateSignedUrlInput = {
  bucketName: string;
  objectKey: string;
  action: "read" | "write" | "resumable";
  contentType?: string;
  expiresMs?: number;
  responseDisposition?: string;
};

export type ListObjectsInput = {
  bucketName: string;
  prefix: string;
  maxResults?: number;
};
