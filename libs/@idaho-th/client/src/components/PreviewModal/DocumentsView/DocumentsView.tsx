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

import { observer } from "mobx-react-lite";
import React, { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { formatTimestamp } from "~@idaho-th/client/utils/date";
import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../datastores/IdahoTHStoreContext";
import {
  useDocumentDownloadUrl,
  useDocumentsList,
} from "../../../hooks/documents";
import { useApplicationDetailByRole } from "../../../hooks/useApplicationDetail";
import { useDocumentUpload } from "../../../hooks/useDocumentUpload";
import { BodyS1, palette } from "../../../styles";
import {
  ALLOWED_ACCEPT,
  formatFileSize,
  getDisplayFileName,
  MAX_DOCUMENT_BYTES,
  triggerBrowserDownload,
} from "../../../utils/documents";
import CheckCircleIcon from "../../assets/check-circle.svg?react";
import DashedSpinnerIcon from "../../assets/dashed-spinner.svg?react";
import DownloadIcon from "../../assets/download.svg?react";
import ExclamationCircleIcon from "../../assets/exclamation-circle.svg?react";
import DocumentIcon from "../../assets/single-document.svg?react";
import TrashIcon from "../../assets/trash-icon.svg?react";
import { ConfirmationModal } from "../../ConfirmationModal/ConfirmationModal";
import * as PanelStyled from "../PreviewModal.styles";
import { StaffClosedBanner } from "../StaffPreviewModal/StaffClosedBanner";
import * as Styled from "./DocumentsView.styles";

interface DocumentsViewProps {
  canUpload?: boolean;
  variant: "staff" | "provider";
}

export const DocumentsView: React.FC<DocumentsViewProps> = observer(
  function DocumentsView({ canUpload = false, variant }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deleteTarget, setDeleteTarget] = useState<{
      id: string;
      displayName: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const store = useHousingApplicationsStore();
    const applicationId = store.currentApplicationId;
    const detail = useApplicationDetailByRole(applicationId, variant);
    const clientName = detail?.clientName ?? "";
    const isClosed = detail?.stage === APPLICATION_STAGE.CLOSED;
    const { startUpload, cancelUpload, canCancelUpload, startDelete } =
      useDocumentUpload();

    const getDownloadUrl = useDocumentDownloadUrl(variant);
    const listQuery = useDocumentsList(applicationId, variant);
    const documents = useMemo(
      () =>
        [...(listQuery.data ?? [])].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        ),
      [listQuery.data],
    );

    const pendingUploads = Array.from(store.pendingUploads.values()).filter(
      (p) => p.applicationId === applicationId,
    );
    const pendingDocumentIds = new Set(
      pendingUploads.map((p) => p.documentId).filter((id) => id.length > 0),
    );
    const visibleDocuments = documents.filter(
      (doc) => !pendingDocumentIds.has(doc.id),
    );

    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !applicationId) return;
      e.target.value = "";
      if (file.size > MAX_DOCUMENT_BYTES) {
        setErrorMessage(
          `File too large — max ${formatFileSize(MAX_DOCUMENT_BYTES)}`,
        );
        return;
      }
      setErrorMessage(null);
      startUpload(file, applicationId, variant);
    };

    const handleDownload = async (
      documentId: string,
      fileName: string,
      mimeType: string,
    ) => {
      if (!applicationId) return;
      setErrorMessage(null);
      try {
        const result = await getDownloadUrl(documentId, applicationId);

        if (result.downloadUrl) {
          triggerBrowserDownload({
            href: result.downloadUrl,
            openInNewTab: true,
          });
        } else if (result.contentBase64) {
          triggerBrowserDownload({
            href: `data:${mimeType};base64,${result.contentBase64}`,
            download: fileName,
          });
        } else {
          setErrorMessage("Download failed — please try again.");
        }
      } catch {
        setErrorMessage("Download failed — please try again.");
      }
    };

    const handleDeleteConfirm = async () => {
      if (!deleteTarget || !applicationId) return;
      const id = deleteTarget.id;
      setDeleteTarget(null);
      try {
        await startDelete(id, applicationId, variant);
      } catch {
        setErrorMessage("Delete failed — please try again.");
      }
    };

    const removePending = (pendingId: string) => {
      store.removePendingUpload(pendingId);
    };

    const isEmpty =
      visibleDocuments.length === 0 && pendingUploads.length === 0;

    return (
      <>
        <Styled.PanelRoot>
          <PanelStyled.PanelHeader>
            <PanelStyled.PanelTitle>Documents</PanelStyled.PanelTitle>
          </PanelStyled.PanelHeader>

          <Styled.PanelBody>
            {variant === "staff" && isClosed && <StaffClosedBanner />}
            {errorMessage && (
              <Styled.ErrorBanner>
                <Styled.FileStatusIcon $variant="error">
                  <ExclamationCircleIcon />
                </Styled.FileStatusIcon>
                <Styled.FileStatusText $variant="error">
                  {errorMessage}
                </Styled.FileStatusText>
              </Styled.ErrorBanner>
            )}
            {listQuery.isLoading && (
              <Styled.EmptyState>
                <BodyS1 $color={palette.foreground.secondary}>
                  Loading documents…
                </BodyS1>
              </Styled.EmptyState>
            )}
            {!listQuery.isLoading && listQuery.isError && (
              <Styled.EmptyState>
                <BodyS1 $color={palette.foreground.secondary}>
                  Failed to load documents.
                </BodyS1>
              </Styled.EmptyState>
            )}
            {!listQuery.isLoading && !listQuery.isError && isEmpty && (
              <Styled.EmptyState>
                <BodyS1 $color={palette.foreground.secondary}>
                  No documents uploaded yet.
                </BodyS1>
              </Styled.EmptyState>
            )}
            {!listQuery.isLoading && !listQuery.isError && !isEmpty && (
              <>
                {visibleDocuments.map((doc) => {
                  const displayName = getDisplayFileName(
                    doc.documentType,
                    doc.fileName,
                    clientName,
                  );
                  return (
                    <Styled.FileCard key={doc.id}>
                      <Styled.FileCardInner>
                        <Styled.FileIconWrapper>
                          <DocumentIcon />
                        </Styled.FileIconWrapper>

                        <Styled.FileMeta>
                          <Styled.FileName>{displayName}</Styled.FileName>
                          <Styled.FileDate>
                            {formatTimestamp(doc.createdAt)}
                          </Styled.FileDate>
                        </Styled.FileMeta>

                        <Styled.FileActions>
                          <Styled.IconButton
                            type="button"
                            aria-label="Download document"
                            onClick={() =>
                              handleDownload(
                                doc.id,
                                displayName,
                                doc.contentType,
                              )
                            }
                          >
                            <DownloadIcon />
                          </Styled.IconButton>
                          {doc.canDelete && !isClosed && (
                            <Styled.IconButton
                              type="button"
                              aria-label="Delete document"
                              onClick={() =>
                                setDeleteTarget({ id: doc.id, displayName })
                              }
                            >
                              <TrashIcon />
                            </Styled.IconButton>
                          )}
                        </Styled.FileActions>
                      </Styled.FileCardInner>
                    </Styled.FileCard>
                  );
                })}

                {pendingUploads.map((pending) => {
                  const showPendingAction =
                    (pending.status === "uploading" &&
                      canCancelUpload(pending.pendingId)) ||
                    pending.status === "failed" ||
                    pending.status === "scanning";

                  const handlePendingActionClick = () => {
                    if (pending.status === "scanning") {
                      toast(
                        "Upload in progress. Please try again in a few seconds.",
                      );
                      return;
                    }
                    if (pending.status === "uploading") {
                      cancelUpload(pending.pendingId);
                      return;
                    }
                    removePending(pending.pendingId);
                  };

                  return (
                    <React.Fragment key={pending.pendingId}>
                      <Styled.FileCard>
                        <Styled.FileCardInner>
                          <Styled.FileIconWrapper>
                            <DocumentIcon />
                          </Styled.FileIconWrapper>

                          <Styled.FileMeta>
                            <Styled.FileName>
                              {getDisplayFileName(
                                "ATTACHMENT",
                                pending.fileName,
                                clientName,
                              )}
                            </Styled.FileName>
                            <Styled.FileStatusRow>
                              {(pending.status === "uploading" ||
                                pending.status === "scanning" ||
                                pending.status === "updating") && (
                                <>
                                  {pending.totalBytes > 0 && (
                                    <>
                                      <Styled.FileStatusText $variant="uploading">
                                        {formatFileSize(pending.loadedBytes)} /{" "}
                                        {formatFileSize(pending.totalBytes)}
                                      </Styled.FileStatusText>
                                      <Styled.DotSeparator />
                                    </>
                                  )}
                                  <Styled.UploadSpinner>
                                    <DashedSpinnerIcon />
                                  </Styled.UploadSpinner>
                                  <Styled.FileStatusText $variant="uploading">
                                    {pending.status === "updating"
                                      ? "Updating…"
                                      : "Uploading…"}
                                  </Styled.FileStatusText>
                                </>
                              )}
                              {pending.status === "success" && (
                                <Styled.FileStatusGroup>
                                  <Styled.FileStatusIcon $variant="success">
                                    <CheckCircleIcon />
                                  </Styled.FileStatusIcon>
                                  <Styled.FileStatusText $variant="success">
                                    Completed
                                  </Styled.FileStatusText>
                                </Styled.FileStatusGroup>
                              )}
                              {pending.status === "failed" && (
                                <>
                                  <Styled.FileStatusIcon $variant="error">
                                    <ExclamationCircleIcon />
                                  </Styled.FileStatusIcon>
                                  <Styled.FileStatusText $variant="error">
                                    {pending.errorMessage ?? "Upload failed"}
                                  </Styled.FileStatusText>
                                </>
                              )}
                            </Styled.FileStatusRow>
                          </Styled.FileMeta>

                          {showPendingAction && (
                            <Styled.FileActions>
                              <Styled.IconButton
                                type="button"
                                onClick={handlePendingActionClick}
                                aria-label={"upload action"}
                              >
                                <TrashIcon />
                              </Styled.IconButton>
                            </Styled.FileActions>
                          )}
                        </Styled.FileCardInner>
                      </Styled.FileCard>
                      {pending.status === "failed" && (
                        <Styled.ErrorHint>
                          The file couldn&apos;t be uploaded. Upload new one.
                        </Styled.ErrorHint>
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </Styled.PanelBody>

          {canUpload && !isClosed && (
            <Styled.PanelFooter>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_ACCEPT}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <Styled.UploadButton
                as="button"
                type="button"
                onClick={handleUploadClick}
              >
                Upload a Document
              </Styled.UploadButton>
            </Styled.PanelFooter>
          )}
        </Styled.PanelRoot>

        <ConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          heading="Delete document?"
          subheading={`"${deleteTarget?.displayName}" will be permanently deleted and can't be recovered.`}
          secondaryBtnText="Cancel"
          primaryBtnText="Delete Document"
          variant="destructive"
        />
      </>
    );
  },
);
