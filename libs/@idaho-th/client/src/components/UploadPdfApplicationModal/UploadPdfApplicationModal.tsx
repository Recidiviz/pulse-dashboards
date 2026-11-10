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

import React, { useCallback, useEffect, useRef, useState } from "react";

import { BodyS1, palette } from "../../styles";
import UploadIcon from "../assets/cloud-upload.svg?react";
import ExclamationCircleIcon from "../assets/exclamation-circle.svg?react";
import XIcon from "../assets/x.svg?react";
import { ConfirmationModal } from "../ConfirmationModal/ConfirmationModal";
import type {
  HousingApplicationForm,
  Pdf,
} from "../HousingApplicationForm/types";
import { Modal } from "../Modal/Modal";
import type { CurrentStep } from "./hooks/useVertexPdfExtraction";
import { useVertexPdfExtraction } from "./hooks/useVertexPdfExtraction";
import { Loader } from "./Loader";
import * as Styled from "./UploadPdfApplicationModal.styles";

const UPLOAD_STAGES = [
  "1. Uploading document",
  "2. Detecting page orientation",
  "3. Extracting information",
] as const;

const UPLOAD_STAGE_DURATIONS_MS = [5_000, 5_000, 30_000] as const;

const STEP_STAGE_INDEX: Record<CurrentStep, number> = {
  uploading: 0,
  scanning: 1,
  extracting: 2,
};

interface UploadPdfApplicationModalProps {
  isOpen: boolean;
  hideModal: () => void;
  onCompletion?: (
    applicationId: string,
    extractContentResponse: HousingApplicationForm,
    preparedPdf?: Pdf,
  ) => void;
}

export const UploadPdfApplicationModal: React.FC<
  UploadPdfApplicationModalProps
> = ({ isOpen, hideModal, onCompletion }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const {
    isLoading,
    isProcessingComplete,
    currentStep,
    showProcessingError,
    dismissProcessingError,
    handlePdfSelected,
    handleBarFilled,
  } = useVertexPdfExtraction({ hideModal, onCompletion });

  const handleBrowseFiles = useCallback(() => {
    inputRef.current?.click();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener("dragover", preventDefault, true);
    document.addEventListener("drop", preventDefault, true);

    return () => {
      document.removeEventListener("dragover", preventDefault, true);
      document.removeEventListener("drop", preventDefault, true);
    };
  }, [isOpen]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    dragDepthRef.current += 1;
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragOver(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      handlePdfSelected(file);
    },
    [handlePdfSelected],
  );

  if (isLoading)
    return (
      <Loader
        stages={UPLOAD_STAGES}
        stageDurationsMs={UPLOAD_STAGE_DURATIONS_MS}
        stageIndex={STEP_STAGE_INDEX[currentStep]}
        isProcessingComplete={isProcessingComplete}
        onBarFilled={handleBarFilled}
      />
    );

  if (showProcessingError)
    return (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={hideModal}
        onConfirm={dismissProcessingError}
        icon={<ExclamationCircleIcon aria-hidden />}
        heading="Something went wrong"
        subheading={
          <BodyS1 $color={palette.foreground.secondary}>
            We weren&apos;t able to process your document. Please make sure
            you&apos;re uploading Version 2.0 of the IDOC Housing Application
            and try again. If the problem persists, email us at{" "}
            <Styled.FeedbackLink href="mailto:feedback@recidiviz.org">
              feedback@recidiviz.org
            </Styled.FeedbackLink>
          </BodyS1>
        }
        secondaryBtnText="Cancel"
        primaryBtnText="Try again"
      />
    );

  return (
    <Modal
      isOpen={isOpen}
      hideModal={hideModal}
      width="min(32.5rem, calc(100vw - 2rem))"
      maxWidth="32.5rem"
      padding="0"
    >
      <Styled.ModalHeader>
        <Styled.HeaderTextGroup>
          <Styled.ModalTitle>Upload PDF application</Styled.ModalTitle>
          <Styled.ModalSubtitle>
            Use an existing file to generate application
          </Styled.ModalSubtitle>
        </Styled.HeaderTextGroup>

        <Styled.CloseButton
          type="button"
          aria-label="Close modal"
          onClick={hideModal}
        >
          <XIcon />
        </Styled.CloseButton>
      </Styled.ModalHeader>

      <Styled.ModalBody>
        <Styled.HiddenFileInput
          ref={inputRef}
          type="file"
          aria-label="PDF application file"
          accept="application/pdf,.pdf"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            handlePdfSelected(file);
            e.target.value = "";
          }}
        />

        <Styled.Slot>
          <Styled.Dropzone
            ref={dropRef}
            $isDragOver={isDragOver}
            role="button"
            tabIndex={0}
            onClick={handleBrowseFiles}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleBrowseFiles?.();
              }
            }}
          >
            <Styled.DropzoneContent>
              <UploadIcon width="2rem" height="2rem" />

              <Styled.DropzoneTextGroup>
                <Styled.DropzoneTitle>
                  Choose a file or drag & drop it here.
                </Styled.DropzoneTitle>
                <Styled.DropzoneHint>
                  PDF format, up to 10 MB.
                </Styled.DropzoneHint>
              </Styled.DropzoneTextGroup>

              <Styled.BrowseLink
                type="button"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBrowseFiles?.();
                }}
              >
                Browse files
              </Styled.BrowseLink>
            </Styled.DropzoneContent>
          </Styled.Dropzone>
        </Styled.Slot>
      </Styled.ModalBody>
    </Modal>
  );
};
