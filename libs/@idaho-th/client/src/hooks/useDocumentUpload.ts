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

import { TRPCClientError } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import { useCallback, useRef } from "react";

import { DOCUMENT_UPLOAD_ERROR } from "~@idaho-th/shared";
import type { AppRouter } from "~@idaho-th/trpc-types";

import { useHousingApplicationsStore } from "../datastores/IdahoTHStoreContext";
import { trpc } from "../trpc/client";
import {
  formatFileSize,
  MAX_DOCUMENT_BYTES,
  resolveMimeType,
} from "../utils/documents";

type DocumentScanStatus =
  inferRouterOutputs<AppRouter>["documents"]["getScanStatusForStaff"]["scanStatus"];

/** Delay before firing the first scanStatus request. */
const SCAN_STATUS_POLL_INITIAL_DELAY_MS = 4000;
/** How often to re-check scanStatus while it's still PENDING. */
const SCAN_STATUS_POLL_INTERVAL_MS = 1500;
/** Give up and throw if no terminal scanStatus arrives within this long. */
export const SCAN_STATUS_POLL_TIMEOUT_MS = 30000;

export class DocumentScanError extends Error {}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollDocumentScanStatus(
  getScanStatus: (input: {
    documentId: string;
  }) => Promise<{ scanStatus: DocumentScanStatus }>,
  documentId: string,
  isAborted: () => boolean,
): Promise<void> {
  const deadline = Date.now() + SCAN_STATUS_POLL_TIMEOUT_MS;

  await delay(SCAN_STATUS_POLL_INITIAL_DELAY_MS);

  while (!isAborted()) {
    if (Date.now() >= deadline) {
      throw new DocumentScanError("File scan timed out");
    }

    // eslint-disable-next-line no-await-in-loop -- must resolve before checking the verdict and sleeping again
    const { scanStatus } = await getScanStatus({ documentId });

    if (scanStatus === "CLEAN") return;

    if (scanStatus === "INFECTED" || scanStatus === "FAILED") {
      throw new DocumentScanError(
        scanStatus === "INFECTED"
          ? "File failed a security scan"
          : "File scan failed",
      );
    }

    // eslint-disable-next-line no-await-in-loop -- intentional sequential poll
    await delay(SCAN_STATUS_POLL_INTERVAL_MS);
  }
}

export async function initiateResumableUpload(
  signedUrl: string,
  contentType: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(signedUrl, {
    method: "POST",
    headers: {
      "x-goog-resumable": "start",
      "Content-Type": contentType,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate upload: ${response.status}`);
  }

  const location = response.headers.get("Location");
  if (!location) {
    throw new Error("No Location header from GCS upload initiation");
  }

  return location;
}

export function uploadToGcsWithProgress(
  sessionUrl: string,
  file: File,
  contentType: string,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", sessionUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    const onSignalAbort = () => xhr.abort();
    // The outer AbortController stays alive through confirm + scan polling,
    // so this listener must be detached once the XHR settles — otherwise it
    // pins `xhr` (and the File it holds) in memory long after this step is done.
    signal?.addEventListener("abort", onSignalAbort);
    const detachSignalListener = () =>
      signal?.removeEventListener("abort", onSignalAbort);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded, e.total);
      }
    });

    xhr.addEventListener("load", () => {
      detachSignalListener();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`GCS upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      detachSignalListener();
      reject(new Error("Network error during upload"));
    });
    xhr.addEventListener("abort", () => {
      detachSignalListener();
      reject(new Error("Upload aborted"));
    });

    xhr.send(file);
  });
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof DocumentScanError) {
    return error.message;
  }
  if (error instanceof TRPCClientError) {
    switch (error.message) {
      case DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE:
        return `File is too large (max ${formatFileSize(MAX_DOCUMENT_BYTES)})`;
      case DOCUMENT_UPLOAD_ERROR.UNSUPPORTED_FILE_TYPE:
        return "Unsupported file type";
      case DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH:
        return "File content does not match type";
    }
  }
  return "Upload failed";
}

export function useDocumentUpload() {
  const store = useHousingApplicationsStore();
  const utils = trpc.useUtils();
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const cancelUpload = useCallback(
    (pendingId: string) => {
      if (store.pendingUploads.get(pendingId)?.status === "scanning") return;
      controllersRef.current.get(pendingId)?.abort();
    },
    [store],
  );

  const canCancelUpload = useCallback(
    (pendingId: string) => controllersRef.current.has(pendingId),
    [],
  );

  const startUpload = useCallback(
    (
      file: File,
      applicationId: string,
      variant: "staff" | "provider",
    ): string => {
      const pendingId = crypto.randomUUID();
      const isStaff = variant === "staff";
      const mimeType = resolveMimeType(file);
      const controller = new AbortController();
      let lastProgress = 0;

      controller.signal.addEventListener("abort", () => {
        store.removePendingUpload(pendingId);
        controllersRef.current.delete(pendingId);
      });
      controllersRef.current.set(pendingId, controller);

      const requestUpload = isStaff
        ? utils.client.documents.requestUploadForStaff
        : utils.client.documents.requestUploadForProvider;
      const confirmUpload = isStaff
        ? utils.client.documents.confirmUploadForStaff
        : utils.client.documents.confirmUploadForProvider;
      const getScanStatus = isStaff
        ? utils.client.documents.getScanStatusForStaff
        : utils.client.documents.getScanStatusForProvider;

      const invalidateDocumentList = () => {
        void (isStaff
          ? utils.documents.listForStaff.invalidate({ applicationId })
          : utils.documents.listForProvider.invalidate({ applicationId }));
        void (isStaff
          ? utils.timeline.getForStaff.invalidate({ applicationId })
          : utils.timeline.getForProvider.invalidate({ applicationId }));
      };

      store.addPendingUpload({
        pendingId,
        applicationId,
        documentId: "",
        fileName: file.name,
        status: "uploading",
        progress: 0,
        loadedBytes: 0,
        totalBytes: file.size,
      });

      void (async () => {
        try {
          const payload = {
            applicationId,
            fileName: file.name,
            mimeType,
            sizeBytes: file.size,
          };

          const { documentId, uploadUrl } = await requestUpload.mutate(
            payload,
            { signal: controller.signal },
          );

          if (controller.signal.aborted) return;

          store.updatePendingUpload(pendingId, { documentId });

          const sessionUrl = await initiateResumableUpload(
            uploadUrl,
            mimeType,
            controller.signal,
          );

          if (controller.signal.aborted) return;

          await uploadToGcsWithProgress(
            sessionUrl,
            file,
            mimeType,
            (loaded, total) => {
              const progress = Math.round((loaded / total) * 100);
              if (progress === lastProgress) return;
              lastProgress = progress;
              store.updatePendingUpload(pendingId, {
                loadedBytes: loaded,
                totalBytes: total,
                progress,
              });
            },
            controller.signal,
          );

          await confirmUpload.mutate(
            { documentId },
            { signal: controller.signal },
          );

          if (controller.signal.aborted) return;

          store.updatePendingUpload(pendingId, { status: "scanning" });

          await pollDocumentScanStatus(
            (input) =>
              getScanStatus.query(input, { signal: controller.signal }),
            documentId,
            () => controller.signal.aborted,
          );

          if (controller.signal.aborted) return;

          store.updatePendingUpload(pendingId, {
            status: "success",
            progress: 100,
            loadedBytes: file.size,
            totalBytes: file.size,
          });

          controllersRef.current.delete(pendingId);
          invalidateDocumentList();

          setTimeout(() => {
            store.removePendingUpload(pendingId);
          }, 2000);
        } catch (error) {
          if (controller.signal.aborted) return;

          controllersRef.current.delete(pendingId);
          store.updatePendingUpload(pendingId, {
            status: "failed",
            errorMessage: uploadErrorMessage(error),
          });
        }
      })();

      return pendingId;
    },
    [store, utils],
  );

  const startDelete = useCallback(
    async (
      documentId: string,
      applicationId: string,
      variant: "staff" | "provider",
    ): Promise<void> => {
      const isStaff = variant === "staff";
      const deleteDoc = isStaff
        ? utils.client.documents.deleteForStaff
        : utils.client.documents.deleteForProvider;
      const invalidateDocumentList = () =>
        void (isStaff
          ? utils.documents.listForStaff.invalidate({ applicationId })
          : utils.documents.listForProvider.invalidate({ applicationId }));

      await deleteDoc.mutate({ documentId });
      invalidateDocumentList();
    },
    [utils],
  );

  return { startUpload, cancelUpload, canCancelUpload, startDelete };
}
