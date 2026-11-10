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
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { formatResponseTimestamp } from "~@idaho-th/client/utils/date";
import {
  APPLICATION_STAGE,
  APPLICATION_SUB_STAGE,
  PROVIDER_RESPONSE_STATUS_MESSAGE,
  PROVIDER_RESPONSE_TYPE,
  type ProviderResponseType,
} from "~@idaho-th/shared";

import { useHousingApplicationsStore } from "../../../../../datastores/IdahoTHStoreContext";
import {
  useEditProviderInfoRequestMessage,
  useProviderHomePlan,
  useProviderInfoRequests,
  useSubmitProviderResponse,
} from "../../../../../hooks/housingApplication";
import { useProviderApplicationById } from "../../../../../hooks/useApplicationDetail";
import {
  BodyS1,
  borderRadius,
  fontWeights,
  palette,
} from "../../../../../styles";
import CheckIcon from "../../../../assets/check.svg?react";
import MessageIcon from "../../../../assets/message.svg?react";
import XSolidIcon from "../../../../assets/x-solid.svg?react";
import { ActionButton } from "../../../../common/buttons";
import { ConfirmationModal } from "../../../../ConfirmationModal";
import { RequestInfoModal } from "../../../common/InfoRequest";
import {
  getSubmittedStatus,
  HOME_PLAN_REVOKABLE_STAGES,
  LOCKED_SUB_STAGES,
  PROVIDER_APPLICATION_SUB_STAGE,
  RESPONSES_WITH_CHANGE_SUB_STAGES,
  SUB_STAGE_TO_RESPONSE_TYPE,
  SUBMITTED_RESPONSE_SUB_STAGES,
} from "../constants";
import { getLatestProviderMessage } from "../utils";
import * as Styled from "./ApplicationResponseSelector.styles";
import { RevokeApprovalModal } from "./RevokeApprovalModal";

type ActiveModal =
  | "conditionallyApprove"
  | "requestInfo"
  | "decline"
  | "revokeApproval"
  | null;

export const ApplicationResponseSelector: React.FC = observer(
  function ApplicationResponseSelector() {
    const store = useHousingApplicationsStore();
    const { currentApplicationId: applicationId } = store;
    const { data: currentApplication } = useProviderApplicationById(
      applicationId,
      false,
    );
    const currentStage = currentApplication?.stage;
    const currentSubStage = currentApplication?.subStage as string | undefined;
    const isClosed = currentStage === APPLICATION_STAGE.CLOSED;

    const submitMutation = useSubmitProviderResponse();
    const editInfoRequestMutation = useEditProviderInfoRequestMessage();

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingFromResponse, setEditingFromResponse] =
      useState<ProviderResponseType | null>(null);

    const hasSubmittedResponse =
      !isEditing &&
      currentSubStage != null &&
      (SUBMITTED_RESPONSE_SUB_STAGES.has(currentSubStage) || isClosed);

    const infoRequestQuery = useProviderInfoRequests(applicationId, true);
    const messages = infoRequestQuery.data?.infoRequests?.[0]?.messages ?? [];

    const providerMessage = getLatestProviderMessage(messages);

    const isSelectedAsHomePlan =
      currentSubStage === PROVIDER_APPLICATION_SUB_STAGE.SELECTED;
    const homePlanQuery = useProviderHomePlan(applicationId, !!applicationId);
    const homePlanUpdatedAt = homePlanQuery.data?.homePlan?.updatedAt ?? null;

    useEffect(() => {
      setActiveModal(null);
      setIsEditing(false);
      setEditingFromResponse(null);
    }, [applicationId]);

    const isSubmitting =
      submitMutation.isPending || editInfoRequestMutation.isPending;

    const isEditingInfoRequest =
      editingFromResponse === PROVIDER_RESPONSE_TYPE.INFO_NEEDED;
    const savedInfoRequestMessage = isEditingInfoRequest
      ? providerMessage?.body ?? ""
      : "";

    const closeActiveModal = () => {
      if (isSubmitting) return;
      setActiveModal(null);
    };

    const submitResponse = (
      response: ProviderResponseType,
      message?: string,
    ) => {
      if (!applicationId) return;

      const onSuccess = () => {
        setActiveModal(null);
        setIsEditing(false);
        setEditingFromResponse(null);

        toast.success(PROVIDER_RESPONSE_STATUS_MESSAGE[response], {
          icon: null,
          style: {
            background: palette.background.strong,
            borderRadius: borderRadius[12],
            color: palette.foreground.onBrand,
            fontSize: "1rem",
            fontWeight: fontWeights.medium,
            lineHeight: "1.5rem",
          },
        });
      };

      const isAmendingInfoRequest =
        response === PROVIDER_RESPONSE_TYPE.INFO_NEEDED &&
        isEditingInfoRequest &&
        infoRequestQuery.data?.infoRequests?.[0] != null;

      if (isAmendingInfoRequest) {
        editInfoRequestMutation.mutate(
          { applicationId, message: message ?? "" },
          { onSuccess },
        );
        return;
      }

      if (
        response === PROVIDER_RESPONSE_TYPE.INFO_NEEDED ||
        response === PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL
      ) {
        submitMutation.mutate(
          { applicationId, response, message: message ?? "" },
          { onSuccess },
        );
        return;
      }

      submitMutation.mutate({ applicationId, response }, { onSuccess });
    };

    const handleEdit = () => {
      const responseType = currentSubStage
        ? SUB_STAGE_TO_RESPONSE_TYPE[currentSubStage] ?? null
        : null;

      setEditingFromResponse(responseType);
      setIsEditing(true);

      if (currentSubStage === APPLICATION_SUB_STAGE.INFO_NEEDED) {
        setActiveModal("requestInfo");
      }
    };

    const isRevokableHomePlan =
      isSelectedAsHomePlan &&
      currentStage != null &&
      HOME_PLAN_REVOKABLE_STAGES.has(currentStage);

    const showRevokeButton =
      !isClosed &&
      hasSubmittedResponse &&
      (currentSubStage ===
        PROVIDER_APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED ||
        isRevokableHomePlan);

    const showChangeButton =
      !isClosed &&
      hasSubmittedResponse &&
      currentSubStage != null &&
      RESPONSES_WITH_CHANGE_SUB_STAGES.has(currentSubStage) &&
      !LOCKED_SUB_STAGES.has(currentSubStage);

    if (hasSubmittedResponse) {
      const status = getSubmittedStatus(
        currentSubStage,
        currentApplication?.closedOutcome,
        isClosed,
      );

      let submittedAt: Date | null | undefined =
        currentApplication?.updatedAt ?? null;

      if (currentSubStage === APPLICATION_SUB_STAGE.INFO_NEEDED) {
        submittedAt = providerMessage?.createdAt ?? submittedAt;
      } else if (isSelectedAsHomePlan) {
        submittedAt = homePlanUpdatedAt ?? submittedAt;
      }

      return (
        <Styled.SubmittedResponseContainer $compact={status?.compact}>
          <Styled.SubmittedStatusRow>
            <Styled.SubmittedStatusInfo>
              <Styled.SubmittedStatusBadge
                $variant={status?.variant ?? "success"}
                $centered={status?.centered}
              >
                <Styled.SubmittedStatusBadgeText>
                  <BodyS1>{status?.badge}</BodyS1>
                </Styled.SubmittedStatusBadgeText>
              </Styled.SubmittedStatusBadge>
            </Styled.SubmittedStatusInfo>
            {submittedAt && (
              <Styled.SubmittedTimestamp>
                <BodyS1>{formatResponseTimestamp(submittedAt)}</BodyS1>
              </Styled.SubmittedTimestamp>
            )}
          </Styled.SubmittedStatusRow>
          {currentSubStage === APPLICATION_SUB_STAGE.INFO_NEEDED &&
            providerMessage && (
              <Styled.ResponseMessageField>
                <Styled.SubmittedMessageDisplay>
                  {providerMessage.body}
                </Styled.SubmittedMessageDisplay>
              </Styled.ResponseMessageField>
            )}
          {status?.footnote && (
            <Styled.SubmittedFootnote>
              <BodyS1>{status.footnote}</BodyS1>
            </Styled.SubmittedFootnote>
          )}
          {showRevokeButton && (
            <ActionButton
              variant="destructive"
              size="md"
              onClick={() => setActiveModal("revokeApproval")}
            >
              Revoke conditional approval
            </ActionButton>
          )}
          {showChangeButton && (
            <ActionButton size="md" onClick={handleEdit}>
              {currentSubStage === APPLICATION_SUB_STAGE.INFO_NEEDED
                ? "Edit request"
                : "Edit response"}
            </ActionButton>
          )}

          <RevokeApprovalModal
            isOpen={activeModal === "revokeApproval"}
            onClose={closeActiveModal}
            onSubmit={(message) =>
              submitResponse(
                PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL,
                message,
              )
            }
            isLoading={isSubmitting}
            closesCase={isRevokableHomePlan}
          />
        </Styled.SubmittedResponseContainer>
      );
    }

    if (
      !applicationId ||
      isClosed ||
      isSelectedAsHomePlan ||
      currentStage !== APPLICATION_STAGE.APPLICATION
    ) {
      return null;
    }

    return (
      <>
        <Styled.PendingResponseContainer>
          <Styled.ResponseActionsRow
            role="group"
            aria-label="Application response"
          >
            <ActionButton
              size="md"
              fullWidth
              startIcon={<CheckIcon />}
              disabled={
                isSubmitting ||
                editingFromResponse ===
                  PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE
              }
              onClick={() => setActiveModal("conditionallyApprove")}
            >
              Conditionally Approve
            </ActionButton>
            <ActionButton
              variant="warning"
              size="md"
              fullWidth
              startIcon={<MessageIcon />}
              disabled={isSubmitting}
              onClick={() => setActiveModal("requestInfo")}
            >
              Request Info
            </ActionButton>
            <ActionButton
              variant="destructive"
              size="md"
              startIcon={<XSolidIcon />}
              disabled={isSubmitting}
              onClick={() => setActiveModal("decline")}
            >
              Decline
            </ActionButton>
          </Styled.ResponseActionsRow>
        </Styled.PendingResponseContainer>

        <ConfirmationModal
          isOpen={activeModal === "conditionallyApprove"}
          onClose={closeActiveModal}
          onConfirm={() =>
            submitResponse(PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE)
          }
          heading="Conditionally Approve application?"
          subheading="The Application will be marked as Conditionally Approved. You can update this decision later if needed."
          primaryBtnText="Conditionally Approve"
          secondaryBtnText="Go back"
          isLoading={isSubmitting}
        />

        <RequestInfoModal
          isOpen={activeModal === "requestInfo"}
          onClose={closeActiveModal}
          onSubmit={(message) =>
            submitResponse(PROVIDER_RESPONSE_TYPE.INFO_NEEDED, message)
          }
          initialMessage={savedInfoRequestMessage}
          isLoading={isSubmitting}
        />

        <ConfirmationModal
          isOpen={activeModal === "decline"}
          onClose={closeActiveModal}
          onConfirm={() => submitResponse(PROVIDER_RESPONSE_TYPE.DECLINE)}
          heading="Decline application?"
          subheading="The application will be declined and this decision cannot be changed later."
          variant="destructive"
          primaryBtnText="Decline Application"
          secondaryBtnText="Go back"
          isLoading={isSubmitting}
        />
      </>
    );
  },
);
