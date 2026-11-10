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

import React, { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import toast from "react-hot-toast";

import {
  APPLICATION_STAGE,
  ApplicationIntakeStatus,
  USER_ROLE,
} from "~@idaho-th/shared";

import {
  useHousingApplicationsStore,
  usePreviewModalStore,
} from "../../datastores/IdahoTHStoreContext";
import { useStaffHousingApplications } from "../../hooks/housingApplication";
import {
  PAGE_SIZE,
  useApplicationsTableState,
} from "../../hooks/useApplicationsTableState";
import { useDelay } from "../../hooks/useDelayedTrue";
import type {
  HousingApplication,
  PreviewApplication,
} from "../../interfaces/common";
import { trpc } from "../../trpc/client";
import type { HousingApplicationForm as HousingApplicationFormValues } from "../HousingApplicationForm/types";
import { IntakeFormModal } from "../IntakeFormModal";
import { ProviderMatchLoading } from "../IntakeFormModal/ProviderMatchLoading/ProviderMatchLoading";
import { getStaffInitialTab, StaffPreviewModal } from "../PreviewModal";
import * as PreviewStyled from "../PreviewModal/ApplicationDetailsView/ApplicationDetailsView.styles";
import { DigitizedApplicationPdfTemplate } from "../PreviewModal/ApplicationDetailsView/digitizedApplicationPdf/DigitizedApplicationPdfTemplate";
import { generateDigitizedApplicationPdfFile } from "../PreviewModal/ApplicationDetailsView/digitizedApplicationPdf/generateDigitizedApplicationPdf";
import { Loader } from "../UploadPdfApplicationModal/Loader";
import { UploadPdfApplicationModal } from "../UploadPdfApplicationModal/UploadPdfApplicationModal";
import { AppHeader } from "./AppHeader/AppHeader";
import { ApplicationsTable } from "./ApplicationsTable/ApplicationsTable";
import { STAFF_STATUS_FILTER_OPTIONS } from "./ApplicationsTable/applicationsTable.filters";
import { StaffEmptyState } from "./EmptyState/StaffEmptyState";
import * as Styled from "./HousingApplications.styles";
import { StaffHeading } from "./StaffHeading";
import type { ActionItem } from "./types";

const CLASSIFICATION_ASSISTANT_URL = "https://www.dashboard.recidiviz.org";

const HEADER_ACTIONS: ActionItem[] = [
  {
    key: "classification-assistant",
    label: "Classification Tool",
    onClick: () =>
      window.open(
        CLASSIFICATION_ASSISTANT_URL,
        "_blank",
        "noopener,noreferrer",
      ),
  },
];

const DRAFT_OPEN_ERROR = "Unable to open draft application. Please try again.";
const DRAFT_OPEN_STAGES = ["Opening application"] as const;
const DRAFT_OPEN_STAGE_DURATIONS_MS = [5_000] as const;

export const HousingApplications: React.FC = function HousingApplications() {
  const housingApplicationsStore = useHousingApplicationsStore();
  const previewModalStore = usePreviewModalStore();
  const utils = trpc.useUtils();
  const pdfHostRef = useRef<HTMLDivElement>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [selectedApplication, setSelectedApplication] = useState<
    PreviewApplication | undefined
  >();
  const [pdf, setPdf] = useState<string | null>(null);
  const [intakeFormDefaultValues, setIntakeFormDefaultValues] =
    useState<HousingApplicationFormValues | null>(null);
  const [intakeModalKey, setIntakeModalKey] = useState(0);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isDraftProcessingComplete, setIsDraftProcessingComplete] =
    useState(false);
  const pendingDraftIntakeRef = useRef<{
    formValues: HousingApplicationFormValues;
    pdfUrl: string;
  } | null>(null);
  const [pdfFormData, setPdfFormData] =
    useState<HousingApplicationFormValues | null>(null);
  const [pdfPreferredProviderNames, setPdfPreferredProviderNames] = useState<
    string[]
  >([]);
  const [matchingApplicationId, setMatchingApplicationId] = useState<
    string | null
  >(null);
  const isMatching = matchingApplicationId !== null;

  const {
    sorting,
    filters,
    hasSearch,
    pagination,
    query,
    handleSearchChange,
    handleFiltersChange,
    handleSortingChange,
  } = useApplicationsTableState(USER_ROLE.STAFF);

  const { data, isLoading, isFetching, isPlaceholderData } =
    useStaffHousingApplications(query);
  const showFetching = useDelay(isFetching && isPlaceholderData);
  const applications = data?.items ?? [];

  const handleUploadPdf = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  const handleCloseIntakeModal = useCallback(() => {
    setIsIntakeModalOpen(false);
    setPdf(null);
    setIntakeFormDefaultValues(null);
    housingApplicationsStore.setCurrentApplicationId(undefined);
  }, [housingApplicationsStore]);

  const openPreviewModal = useCallback(
    (application: PreviewApplication) => {
      previewModalStore.setInitialTab(getStaffInitialTab(application.stage));
      setSelectedApplication(application);
      setIsPreviewModalOpen(true);
    },
    [previewModalStore],
  );

  const handleOpenPreviewModal = useCallback(
    (applicationId: string) => {
      // A just-submitted intake always lands at APPLICATION stage.
      openPreviewModal({
        id: applicationId,
        stage: APPLICATION_STAGE.APPLICATION,
      });
      setIsIntakeModalOpen(false);
    },
    [openPreviewModal],
  );

  const handleClosePreviewModal = useCallback(() => {
    setIsPreviewModalOpen(false);
    setSelectedApplication(undefined);
    handleCloseIntakeModal();
  }, [handleCloseIntakeModal]);

  const handleDuplicated = useCallback(
    (newApplicationId: string) => {
      // This re-opens the StaffPreviewModal on the new duplicated application,
      // which mirrors the intake Finish state and so starts at APPLICATION stage.
      housingApplicationsStore.setCurrentApplicationId(newApplicationId);
      openPreviewModal({
        id: newApplicationId,
        stage: APPLICATION_STAGE.APPLICATION,
      });
    },
    [housingApplicationsStore, openPreviewModal],
  );

  const handleStartMatching = useCallback((applicationId: string) => {
    setMatchingApplicationId(applicationId);
  }, []);

  const handleMatchingComplete = useCallback(() => {
    if (matchingApplicationId) {
      handleOpenPreviewModal(matchingApplicationId);
    }
    setMatchingApplicationId(null);
  }, [matchingApplicationId, handleOpenPreviewModal]);

  const handlePrepareDigitizedPdf = useCallback(
    async (values: HousingApplicationFormValues) => {
      const { providers } = await utils.housingApplication.getProviders.fetch({
        distinct: ["id"],
      });
      const providerNameById = new Map(
        providers.map((provider) => [provider.id, provider.name]),
      );
      const preferredProviderNames = (values.preferredProviders ?? [])
        .map((id) => providerNameById.get(id))
        .filter((name): name is string => name !== undefined);

      flushSync(() => {
        setPdfFormData(values);
        setPdfPreferredProviderNames(preferredProviderNames);
      });
      try {
        const pdfHost = pdfHostRef.current;
        if (!pdfHost) return null;
        return await generateDigitizedApplicationPdfFile(
          pdfHost,
          values.clientFullName ?? "",
        );
      } finally {
        setPdfFormData(null);
      }
    },
    [utils],
  );

  const openIntakeModal = useCallback(
    (formValues: HousingApplicationFormValues, pdfUrl: string) => {
      setIntakeFormDefaultValues(formValues);
      setPdf(pdfUrl);
      setIntakeModalKey((key) => key + 1);
      setIsIntakeModalOpen(true);
    },
    [],
  );

  const handleDraftBarFilled = useCallback(() => {
    setIsDraftLoading(false);
    setIsDraftProcessingComplete(false);
    const pending = pendingDraftIntakeRef.current;
    pendingDraftIntakeRef.current = null;
    if (pending) {
      openIntakeModal(pending.formValues, pending.pdfUrl);
    }
  }, [openIntakeModal]);

  const openDraftIntake = useCallback(
    async (applicationId: string) => {
      setIsDraftLoading(true);
      setIsDraftProcessingComplete(false);
      pendingDraftIntakeRef.current = null;
      try {
        const [detail, documents] = await Promise.all([
          utils.housingApplication.getStaffApplicationById.fetch({
            applicationId,
          }),
          utils.documents.listForStaff.fetch({ applicationId }),
        ]);
        const sourceDoc = documents.find(
          (document) => document.documentType === "HANDWRITTEN_SOURCE",
        );
        if (!sourceDoc) {
          toast.error(DRAFT_OPEN_ERROR);
          setIsDraftLoading(false);
          return;
        }
        const { downloadUrl } =
          await utils.client.documents.getPreviewUrlForStaff.mutate({
            documentId: sourceDoc.id,
          });
        if (!downloadUrl) {
          toast.error(DRAFT_OPEN_ERROR);
          setIsDraftLoading(false);
          return;
        }
        if (!detail.formData) {
          toast.error(DRAFT_OPEN_ERROR);
          setIsDraftLoading(false);
          return;
        }
        pendingDraftIntakeRef.current = {
          formValues: detail.formData as HousingApplicationFormValues,
          pdfUrl: downloadUrl,
        };
        setIsDraftProcessingComplete(true);
      } catch {
        toast.error(DRAFT_OPEN_ERROR);
        setIsDraftLoading(false);
        setIsDraftProcessingComplete(false);
      }
    },
    [utils],
  );

  const handleRowClick = useCallback(
    (application: HousingApplication) => {
      housingApplicationsStore.setCurrentApplicationId(application.id);

      if (application.intakeStatus === ApplicationIntakeStatus.DRAFT) {
        void openDraftIntake(application.id);
        return;
      }

      openPreviewModal(application);
    },
    [housingApplicationsStore, openDraftIntake, openPreviewModal],
  );

  return (
    <Styled.PageContainer>
      <AppHeader actions={HEADER_ACTIONS} />

      <StaffHeading
        title="Housing Applications"
        subtitle="Find eligible providers for clients"
        onUploadPdf={handleUploadPdf}
        onSearchChange={handleSearchChange}
      />

      <ApplicationsTable
        applications={applications}
        emptyState={<StaffEmptyState />}
        isLoading={isLoading || showFetching}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        onClick={handleRowClick}
        pagination={pagination.getProps({
          data,
          pageSize: PAGE_SIZE,
          isNavigating: isFetching && isPlaceholderData,
        })}
        filters={filters}
        hasSearch={hasSearch}
        onFiltersChange={handleFiltersChange}
        statusFilterOptions={STAFF_STATUS_FILTER_OPTIONS}
      />

      {isDraftLoading && (
        <Loader
          stages={DRAFT_OPEN_STAGES}
          stageDurationsMs={DRAFT_OPEN_STAGE_DURATIONS_MS}
          stageIndex={0}
          isProcessingComplete={isDraftProcessingComplete}
          onBarFilled={handleDraftBarFilled}
        />
      )}

      {isUploadModalOpen && (
        <UploadPdfApplicationModal
          isOpen={isUploadModalOpen}
          hideModal={handleCloseUploadModal}
          onCompletion={(applicationId, formValues, preparedPdf) => {
            // The draft already exists in the DB after extraction; seed the
            // store with its id so Finish submits the same draft (not a new
            // create) and the preview opens on the same applicationId.
            housingApplicationsStore.setCurrentApplicationId(applicationId);
            if (!preparedPdf?.signedUrl) return;
            openIntakeModal(formValues, preparedPdf.signedUrl);
          }}
        />
      )}

      <IntakeFormModal
        key={intakeModalKey}
        isOpen={isIntakeModalOpen && Boolean(pdf) && !isMatching}
        onClose={handleCloseIntakeModal}
        onSubmit={handleStartMatching}
        onPrepareDigitizedPdf={handlePrepareDigitizedPdf}
        pdf={pdf}
        defaultValues={intakeFormDefaultValues}
      />

      <ProviderMatchLoading
        isOpen={isMatching}
        onComplete={handleMatchingComplete}
      />

      {pdfFormData && (
        <PreviewStyled.PdfRenderHost ref={pdfHostRef} aria-hidden>
          <DigitizedApplicationPdfTemplate
            formData={pdfFormData}
            preferredProviderNames={pdfPreferredProviderNames}
          />
        </PreviewStyled.PdfRenderHost>
      )}

      {isPreviewModalOpen && (
        <StaffPreviewModal
          key={selectedApplication?.id}
          isOpen={isPreviewModalOpen}
          application={selectedApplication}
          onClose={handleClosePreviewModal}
          onDuplicated={handleDuplicated}
        />
      )}
    </Styled.PageContainer>
  );
};
