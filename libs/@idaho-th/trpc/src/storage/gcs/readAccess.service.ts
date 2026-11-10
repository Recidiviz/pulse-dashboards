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

import { gcsConfig } from "~@idaho-th/trpc/storage/gcs/gcs.config";
import { MAX_INLINE_READ_BYTES } from "~@idaho-th/trpc/storage/gcs/gcs.constants";
import type {
  GcsObjectMetadataSource,
  GcsObjectRef,
  GcsReadAccessFields,
  ResolveGcsReadAccessOptions,
} from "~@idaho-th/trpc/storage/gcs/gcs.types";
import {
  downloadBufferFromGcs,
  getGcsFile,
  getGcsObjectMetadata,
} from "~@idaho-th/trpc/storage/gcs/objectStorage.service";
import {
  generateSignedReadUrl,
  signingFailureTrpcError,
} from "~@idaho-th/trpc/storage/gcs/signedUrl.service";

function assertSizeWithinInlineLimit(
  metadata: GcsObjectMetadataSource,
  maxInlineBytes: number,
): void {
  const sizeBytes = Number(metadata.size);
  if (Number.isFinite(sizeBytes) && sizeBytes > maxInlineBytes) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "File too large to serve inline",
    });
  }
}

export async function downloadGcsObjectAsBase64(
  ref: GcsObjectRef,
  fileMetadata?: GcsObjectMetadataSource,
  maxInlineBytes = MAX_INLINE_READ_BYTES,
): Promise<string> {
  const metadata = fileMetadata ?? (await getGcsObjectMetadata(ref));
  assertSizeWithinInlineLimit(metadata, maxInlineBytes);

  const buffer = await downloadBufferFromGcs(ref);
  return buffer.toString("base64");
}

/**
 * Returns a signed read URL when credentials allow it. In local dev without
 * signing credentials, may fall back to inline base64 for small objects (unless
 * {@link ResolveGcsReadAccessOptions.devInlineReadFallback} is false).
 */
export async function resolveGcsReadAccess(
  ref: GcsObjectRef,
  options?: ResolveGcsReadAccessOptions,
): Promise<GcsReadAccessFields> {
  const allowDevInlineFallback = options?.devInlineReadFallback ?? true;
  const maxInlineBytes = options?.maxInlineBytes ?? MAX_INLINE_READ_BYTES;

  try {
    return {
      signedUrl: await generateSignedReadUrl({
        bucketName: ref.bucketName,
        objectKey: ref.objectKey,
        expiresMs: options?.expiresMs,
        responseDisposition: options?.responseDisposition,
      }),
      contentBase64: null,
    };
  } catch (error) {
    if (!allowDevInlineFallback) {
      throw signingFailureTrpcError(error);
    }

    if (gcsConfig.isProduction) {
      throw signingFailureTrpcError(error);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("client_email")) {
      throw error;
    }

    const inlineMeta =
      options?.fileMetadata ?? (await getGcsObjectMetadata(ref));
    assertSizeWithinInlineLimit(inlineMeta, maxInlineBytes);

    const file = getGcsFile(ref);
    const [buffer] = await file.download();
    return {
      signedUrl: null,
      contentBase64: buffer.toString("base64"),
    };
  }
}
