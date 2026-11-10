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
import React, { useEffect } from "react";

import { usePreviewModalStore } from "../../../datastores/IdahoTHStoreContext";
import { useStaffApplicationById } from "../../../hooks/useApplicationDetail";
import useIsMobile from "../../../hooks/useIsMobile";
import { useMarkStaffModalOpened } from "../../../hooks/useTimeline";
import type { PreviewApplication } from "../../../interfaces/common";
import { trpc } from "../../../trpc/client";
import XIcon from "../../assets/x.svg?react";
import { Modal } from "../../Modal/Modal";
import { TAB_IDS } from "../constants";
import { DocumentsView } from "../DocumentsView/DocumentsView";
import * as Styled from "../PreviewModal.styles";
import { PreviewModalDetailState } from "../PreviewModalDetailState";
import { TimelineView } from "../TimelineView/TimelineView";
import { ProvidersView } from "./ProvidersView";
import { StaffApplicationDetailsView } from "./StaffApplicationDetailsView/StaffApplicationDetailsView";
import { StaffApprovalsView } from "./StaffApprovalsView";
import { StaffHomePlanView } from "./StaffHomePlanView";
import { StaffSidebar } from "./StaffSidebar";

interface StaffPreviewModalProps {
  application?: PreviewApplication;
  isOpen: boolean;
  onClose: () => void;
  onDuplicated: (newApplicationId: string) => void;
}

export const StaffPreviewModal: React.FC<StaffPreviewModalProps> = observer(
  function StaffPreviewModal({ application, isOpen, onClose, onDuplicated }) {
    const { isTablet } = useIsMobile(true);
    const previewModalStore = usePreviewModalStore();
    const activeTab = previewModalStore.activeTab;
    const applicationId = application?.id;

    const shouldFetchDetail = isOpen && !!applicationId;
    const { isLoading, isError, isSuccess } = useStaffApplicationById(
      applicationId,
      shouldFetchDetail,
    );

    const { mutate: markModalOpened } = useMarkStaffModalOpened();
    const utils = trpc.useUtils();

    useEffect(() => {
      if (!shouldFetchDetail || !isSuccess || !applicationId) {
        return;
      }
      markModalOpened({ applicationId });
      // markModalOpened is the tRPC mutate function whose identity is stable across renders.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationId, shouldFetchDetail, isSuccess]);

    const isDetailLoading = shouldFetchDetail && isLoading;
    const isDetailError = shouldFetchDetail && isError;
    const isDetailLoaded = isSuccess;

    const handleClose = () => {
      previewModalStore.reset();
      void utils.housingApplication.getByStaff.invalidate();
      onClose();
    };

    return (
      <Modal
        isOpen={isOpen}
        hideModal={handleClose}
        height="42.35rem"
        padding="0"
        width={`clamp(0rem, 96vw, ${isTablet ? "48.2rem" : "63.2rem"})`}
      >
        <Styled.ModalContent>
          <StaffSidebar detailLoaded={isDetailLoaded} />
          <Styled.MainPanel>
            <Styled.PanelCloseButton
              type="button"
              aria-label="Close preview"
              onClick={handleClose}
            >
              <XIcon />
            </Styled.PanelCloseButton>
            <PreviewModalDetailState
              isLoading={isDetailLoading}
              isError={isDetailError}
            >
              {activeTab === TAB_IDS.APPLICATION_DETAILS && (
                <StaffApplicationDetailsView
                  onClose={handleClose}
                  onDuplicated={onDuplicated}
                />
              )}
              {activeTab === TAB_IDS.PROVIDERS && <ProvidersView />}
              {activeTab === TAB_IDS.APPROVALS && <StaffApprovalsView />}
              {activeTab === TAB_IDS.HOME_PLAN && <StaffHomePlanView />}
              {activeTab === TAB_IDS.DOCUMENTS && (
                <DocumentsView canUpload variant="staff" />
              )}
              {activeTab === TAB_IDS.TIMELINE && (
                <TimelineView applicationId={applicationId} variant="staff" />
              )}
            </PreviewModalDetailState>
          </Styled.MainPanel>
        </Styled.ModalContent>
      </Modal>
    );
  },
);
