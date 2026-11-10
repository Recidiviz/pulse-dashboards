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

import type { File, GetFilesOptions } from "@google-cloud/storage";
import { TRPCError } from "@trpc/server";

import { getGcsStorageClient } from "~@idaho-th/trpc/storage/gcs/gcs.client";
import { GCS_VALIDATION_CRC32C } from "~@idaho-th/trpc/storage/gcs/gcs.constants";
import type {
  GcsObjectMetadataSource,
  GcsObjectRef,
  ListObjectsInput,
  UploadBufferInput,
} from "~@idaho-th/trpc/storage/gcs/gcs.types";

const GCS_FILE_NOT_FOUND_MESSAGE = "File does not exist";
const GCS_FILE_ALREADY_EXISTS_MESSAGE = "File already exists";
const GCS_NOT_FOUND_MESSAGE_FRAGMENT = "No such object";

/** Checks the SDK's numeric code first since it's stable across versions; message match is a fallback. */
export function isGcsNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ((error as { code?: unknown }).code === 404) return true;
  return error.message.includes(GCS_NOT_FOUND_MESSAGE_FRAGMENT);
}

export function getGcsFile({ bucketName, objectKey }: GcsObjectRef): File {
  return getGcsStorageClient().bucket(bucketName).file(objectKey);
}

export function decodeBase64ToBuffer(
  base64String: string,
  encoding: BufferEncoding = "base64",
): Buffer {
  return Buffer.from(base64String, encoding);
}

export async function gcsObjectExists(ref: GcsObjectRef): Promise<boolean> {
  const [exists] = await getGcsFile(ref).exists();
  return exists;
}

export async function assertGcsObjectExistence(
  ref: GcsObjectRef,
  shouldExist: boolean,
  customMessage?: string,
): Promise<void> {
  const file = getGcsFile(ref);
  const [exists] = await file.exists();

  if (shouldExist ? !exists : exists) {
    throw new TRPCError({
      code: shouldExist ? "NOT_FOUND" : "CONFLICT",
      message:
        customMessage ??
        (shouldExist
          ? GCS_FILE_NOT_FOUND_MESSAGE
          : GCS_FILE_ALREADY_EXISTS_MESSAGE),
    });
  }
}

async function saveBufferToGcs(input: UploadBufferInput): Promise<void> {
  const file = getGcsFile({
    bucketName: input.bucketName,
    objectKey: input.objectKey,
  });

  const validation = input.validation ?? GCS_VALIDATION_CRC32C;

  await file.save(input.buffer, {
    contentType: input.contentType,
    resumable: false,
    validation: validation || undefined,
    metadata: {
      contentType: input.contentType,
    },
  });
}

export async function uploadBufferToGcs(
  input: UploadBufferInput,
): Promise<void> {
  await assertGcsObjectExistence(
    { bucketName: input.bucketName, objectKey: input.objectKey },
    false,
  );

  await saveBufferToGcs(input);
}

/**
 * Writes an object regardless of whether it already exists. Used to send
 * the post-extraction ordered/compressed PDF back through the scan
 * pipeline's upload bucket (see vertex.fromDocument.extractor.ts): the raw
 * upload has usually already been moved out of that bucket by ClamAV (key
 * absent, so overwriteBufferInGcs's existence assertion would fail), but a
 * retried extraction can race a still-pending move (key present, so
 * uploadBufferToGcs's non-existence assertion would fail) — and in
 * single-bucket dev mode the write targets the object's final path, which
 * always exists.
 */
export async function upsertBufferInGcs(
  input: UploadBufferInput,
): Promise<void> {
  await saveBufferToGcs(input);
}

export async function downloadBufferFromGcs(
  ref: GcsObjectRef,
): Promise<Buffer> {
  const file = getGcsFile(ref);
  const [buffer] = await file.download();
  return buffer;
}

export async function downloadGcsObjectHead(
  ref: GcsObjectRef,
  length: number,
): Promise<Buffer> {
  const file = getGcsFile(ref);
  const [buffer] = await file.download({ start: 0, end: length - 1 });
  return buffer;
}

export async function deleteGcsObject(ref: GcsObjectRef): Promise<void> {
  const file = getGcsFile(ref);
  await file.delete();
}

export async function getGcsObjectMetadata(
  ref: GcsObjectRef,
): Promise<GcsObjectMetadataSource> {
  const file = getGcsFile(ref);
  const [metadata] = await file.getMetadata();
  return metadata;
}

export async function listGcsObjects(input: ListObjectsInput): Promise<File[]> {
  const options: GetFilesOptions = {
    prefix: input.prefix,
    maxResults: input.maxResults,
  };
  const [files] = await getGcsStorageClient()
    .bucket(input.bucketName)
    .getFiles(options);
  return files;
}

export function toFiniteNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function toObjectMetadata(
  ref: GcsObjectRef,
  metadata?: GcsObjectMetadataSource,
  defaultContentType = "application/octet-stream",
) {
  const sizeValue = metadata?.size;
  const updatedValue = metadata?.updated;

  return {
    objectKey: ref.objectKey,
    bucketName: ref.bucketName,
    contentType: metadata?.contentType ?? defaultContentType,
    sizeInBytes: sizeValue != null ? toFiniteNumber(sizeValue) : undefined,
    updatedAt:
      updatedValue instanceof Date ? updatedValue.toISOString() : updatedValue,
  };
}
