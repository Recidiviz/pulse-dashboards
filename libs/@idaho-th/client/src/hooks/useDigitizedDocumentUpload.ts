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

import { useCallback } from "react";

import { useHousingApplicationsStore } from "../datastores/IdahoTHStoreContext";
import { trpc } from "../trpc/client";
import {
  initiateResumableUpload,
  pollDocumentScanStatus,
  uploadToGcsWithProgress,
} from "./useDocumentUpload";

const DIGITIZED_PDF_MIME_TYPE = "application/pdf";

const SUCCESS_DISPLAY_MS = 2000;

// The digitized PDF is stored once, right after intake, and stays exactly as
// generated even if the application's release date is edited later (product
// requirement — see the "Original Release Date" label on the PDF itself).
// There is deliberately no replace/regenerate path here.
export function useDigitizedDocumentUpload() {
  const utils = trpc.useUtils();
  const store = useHousingApplicationsStore();

  const uploadDigitizedDocument = useCallback(
    async (applicationId: string, file: File): Promise<void> => {
      const pendingId = crypto.randomUUID();
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
      let lastProgress = 0;

      try {
        const { documentId, uploadUrl } =
          await utils.client.documents.requestDigitizedUploadForStaff.mutate({
            applicationId,
            fileName: file.name,
            mimeType: DIGITIZED_PDF_MIME_TYPE,
            sizeBytes: file.size,
          });

        store.updatePendingUpload(pendingId, { documentId });

        const sessionUrl = await initiateResumableUpload(
          uploadUrl,
          DIGITIZED_PDF_MIME_TYPE,
        );

        await uploadToGcsWithProgress(
          sessionUrl,
          file,
          DIGITIZED_PDF_MIME_TYPE,
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
        );

        await utils.client.documents.confirmUploadForStaff.mutate({
          documentId,
        });

        store.updatePendingUpload(pendingId, { status: "scanning" });

        await pollDocumentScanStatus(
          (input) => utils.client.documents.getScanStatusForStaff.query(input),
          documentId,
          () => false,
        );

        store.updatePendingUpload(pendingId, {
          status: "success",
          progress: 100,
          loadedBytes: file.size,
          totalBytes: file.size,
        });

        void utils.documents.listForStaff.invalidate({ applicationId });
        void utils.timeline.getForStaff.invalidate({ applicationId });

        setTimeout(() => {
          store.removePendingUpload(pendingId);
        }, SUCCESS_DISPLAY_MS);
      } catch (error) {
        store.updatePendingUpload(pendingId, {
          status: "failed",
          errorMessage: "Couldn't save the digitized application PDF.",
        });
        throw error;
      }
    },
    [store, utils],
  );

  return { uploadDigitizedDocument };
}
