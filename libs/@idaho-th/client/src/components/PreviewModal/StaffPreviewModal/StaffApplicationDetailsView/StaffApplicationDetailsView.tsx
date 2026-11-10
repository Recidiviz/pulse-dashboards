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

import React, { useState } from "react";
import toast from "react-hot-toast";

import { formatTimestamp } from "~@idaho-th/client/utils/date";
import {
  APPLICATION_STAGE,
  APPLICATION_SUB_STAGE,
  REASON_TO_CLOSED_OUTCOME,
} from "~@idaho-th/shared";

import {
  useHousingApplicationsStore,
  usePreviewModalStore,
} from "../../../../datastores/IdahoTHStoreContext";
import { useDuplicateHousingApplication } from "../../../../hooks/housingApplication";
import { useStaffApplicationById } from "../../../../hooks/useApplicationDetail";
import { BodyS1, Button2 } from "../../../../styles";
import { ConfirmationModal } from "../../../ConfirmationModal";
import * as Styled from "../../ApplicationDetailsView/ApplicationDetailsView.styles";
import { ApplicationSectionsPanel } from "../../ApplicationDetailsView/components/ApplicationSectionsPanel";
import { TAB_IDS } from "../../constants";
import * as PanelStyled from "../../PreviewModal.styles";
import { StaffClosedBanner } from "../StaffClosedBanner";

interface StaffApplicationDetailsViewProps {
  onClose: () => void;
  onDuplicated: (newApplicationId: string) => void;
}

export const StaffApplicationDetailsView: React.FC<
  StaffApplicationDetailsViewProps
> = ({ onClose, onDuplicated }) => {
  const housingApplicationsStore = useHousingApplicationsStore();
  const previewModalStore = usePreviewModalStore();
  const { currentApplicationId } = housingApplicationsStore;
  const { data: currentApplication } = useStaffApplicationById(
    currentApplicationId,
    !!currentApplicationId,
  );
  const { mutate: duplicateApplication, isPending } =
    useDuplicateHousingApplication();
  const [isDuplicateConfirmOpen, setIsDuplicateConfirmOpen] = useState(false);

  const handleDuplicateConfirm = () => {
    if (!currentApplicationId) {
      onClose();
      setIsDuplicateConfirmOpen(false);
      return;
    }

    duplicateApplication(
      { applicationId: currentApplicationId },
      {
        onSuccess: ({ applicationId }) => {
          setIsDuplicateConfirmOpen(false);
          onDuplicated(applicationId);
        },
        onError: () => toast.error("Failed to duplicate application."),
      },
    );
  };

  const createdDateDisplay = currentApplication?.createdAt
    ? formatTimestamp(currentApplication.createdAt)
    : "—";

  const isClosed = currentApplication?.stage === APPLICATION_STAGE.CLOSED;
  const isPastApplicationStage =
    !!currentApplication &&
    currentApplication.stage !== APPLICATION_STAGE.APPLICATION;
  // A revoked approval is the one close that can still be duplicated, once.
  const isApprovalRevoked =
    currentApplication?.subStage ===
    APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED;
  // A rejected home plan can be duplicated once too, to resend it to other providers.
  const isHousingPlanRejected =
    currentApplication?.closedOutcome ===
    REASON_TO_CLOSED_OUTCOME.housing_plan_rejected;
  const isAlreadyClosedDuplicable = isApprovalRevoked || isHousingPlanRejected;
  const canDuplicate =
    !isClosed ||
    (isAlreadyClosedDuplicable && !currentApplication.hasDuplicate);

  return (
    <Styled.PanelRoot>
      <PanelStyled.PanelHeader>
        <PanelStyled.PanelTitle>Application details</PanelStyled.PanelTitle>
      </PanelStyled.PanelHeader>

      <Styled.PanelBody>
        {isClosed && <StaffClosedBanner />}
        <Styled.DateContainer>
          <Styled.DateInfoRow>
            <Styled.DateInfoLabel>
              <BodyS1>Created Date</BodyS1>
            </Styled.DateInfoLabel>
            <Styled.DateInfoValue>
              <BodyS1>{createdDateDisplay}</BodyS1>
            </Styled.DateInfoValue>
          </Styled.DateInfoRow>
          <Styled.ActionButtonsRow>
            <Styled.ViewButton
              type="button"
              onClick={() => previewModalStore.setActiveTab(TAB_IDS.PROVIDERS)}
            >
              <Button2>
                {isPastApplicationStage
                  ? "View provider responses"
                  : "Add more providers"}
              </Button2>
            </Styled.ViewButton>
            <Styled.ViewButton
              type="button"
              disabled={!canDuplicate}
              onClick={() => setIsDuplicateConfirmOpen(true)}
            >
              <Button2>Duplicate Application</Button2>
            </Styled.ViewButton>
          </Styled.ActionButtonsRow>
        </Styled.DateContainer>
        <Styled.ViewButtonDivider />
        <ApplicationSectionsPanel />
      </Styled.PanelBody>

      <ConfirmationModal
        isOpen={isDuplicateConfirmOpen}
        onClose={() => setIsDuplicateConfirmOpen(false)}
        onConfirm={handleDuplicateConfirm}
        isLoading={isPending}
        variant="destructive"
        heading="Duplicate this application?"
        subheading={
          isAlreadyClosedDuplicable
            ? "A new duplicate will be created. This can't be undone."
            : "The current submission will be closed and a new duplicate will be created. This can't be undone."
        }
        primaryBtnText="Yes, Duplicate"
        secondaryBtnText="Go Back"
      />
    </Styled.PanelRoot>
  );
};
