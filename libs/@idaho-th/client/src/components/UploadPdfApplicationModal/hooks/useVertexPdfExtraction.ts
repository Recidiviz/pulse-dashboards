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

import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { MAX_VERTEX_UPLOAD_BYTES } from "~@idaho-th/shared";

import {
  initiateResumableUpload,
  pollDocumentScanStatus,
  uploadToGcsWithProgress,
} from "../../../hooks/useDocumentUpload";
import { trpc } from "../../../trpc/client";
import type {
  HousingApplicationForm,
  HousingVertexExtractResult,
  Pdf,
} from "../../HousingApplicationForm/types";

function isValidPdf(file: File): boolean {
  return (
    file.type === "application/pdf" && file.size <= MAX_VERTEX_UPLOAD_BYTES
  );
}

export type CurrentStep = "uploading" | "scanning" | "extracting";

interface UseVertexPdfExtractionParams {
  hideModal: () => void;
  onCompletion?: (
    applicationId: string,
    extractContentResponse: HousingApplicationForm,
    preparedPdf?: Pdf,
  ) => void;
}

export function useVertexPdfExtraction({
  hideModal,
  onCompletion,
}: UseVertexPdfExtractionParams) {
  const utils = trpc.useUtils();

  const { mutateAsync: requestUpload } =
    trpc.vertexUpload.requestUpload.useMutation({
      meta: { suppressGlobalError: true },
    });
  const { mutateAsync: confirmUpload } =
    trpc.vertexUpload.confirmUpload.useMutation({
      meta: { suppressGlobalError: true },
    });
  const { mutateAsync: cancelUpload } =
    trpc.vertexUpload.cancelUpload.useMutation({
      meta: { suppressGlobalError: true },
    });
  const { mutateAsync: extractWithVertexAIFromDocument } =
    trpc.vertex.extractWithVertexAIFromDocument.useMutation({
      meta: { suppressGlobalError: true },
      onSuccess: () => void utils.housingApplication.getByStaff.invalidate(),
    });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingComplete, setIsProcessingComplete] =
    useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<CurrentStep>("uploading");
  const [extractionResult, setExtractionResult] =
    useState<HousingVertexExtractResult | null>(null);
  const [showProcessingError, setShowProcessingError] =
    useState<boolean>(false);

  const dismissProcessingError = useCallback(() => {
    setShowProcessingError(false);
  }, []);

  const handleBarFilled = useCallback(() => {
    setIsLoading(false);
    setIsProcessingComplete(false);
    if (extractionResult) {
      onCompletion?.(
        extractionResult.applicationId,
        extractionResult.application as HousingApplicationForm,
        extractionResult.preparedPdf,
      );
      setExtractionResult(null);
    }
    hideModal();
  }, [extractionResult, hideModal, onCompletion]);

  const handlePdfSelected = useCallback(
    async (file: File) => {
      if (!isValidPdf(file)) {
        toast.error(
          file.type !== "application/pdf"
            ? "Please upload a PDF file."
            : `File must be ${String(MAX_VERTEX_UPLOAD_BYTES / (1024 * 1024))} MB or smaller.`,
        );
        return;
      }

      setIsLoading(true);
      setIsProcessingComplete(false);
      setShowProcessingError(false);
      setCurrentStep("uploading");
      let applicationId: string | undefined;
      try {
        const upload = await requestUpload({
          fileName: file.name,
          mimeType: "application/pdf",
          sizeBytes: file.size,
        });
        applicationId = upload.applicationId;
        const { documentId, uploadUrl } = upload;

        const sessionUrl = await initiateResumableUpload(uploadUrl, file.type);
        await uploadToGcsWithProgress(sessionUrl, file, file.type, () => {
          // No progress bar during the raw upload for this flow — the
          // Loader's own animated progress covers "uploading"/"scanning".
        });

        await confirmUpload({ documentId });

        setCurrentStep("scanning");
        await pollDocumentScanStatus(
          (input) => utils.client.vertexUpload.getScanStatus.query(input),
          documentId,
          () => false,
        );

        setCurrentStep("extracting");
        setExtractionResult(
          await extractWithVertexAIFromDocument({ documentId }),
        );
        setIsProcessingComplete(true);
      } catch {
        if (applicationId) {
          await cancelUpload({ applicationId }).catch(() => undefined);
        }
        setShowProcessingError(true);
        setIsLoading(false);
        setIsProcessingComplete(false);
      }
    },
    [
      cancelUpload,
      confirmUpload,
      extractWithVertexAIFromDocument,
      requestUpload,
      utils,
    ],
  );

  return {
    isLoading,
    isProcessingComplete,
    currentStep,
    showProcessingError,
    dismissProcessingError,
    handlePdfSelected,
    handleBarFilled,
  };
}
