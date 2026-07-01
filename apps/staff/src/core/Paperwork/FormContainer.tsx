// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  Sans12,
  Sans24,
  spacing,
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import * as Sentry from "@sentry/react";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import { useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  Icon,
  palette,
} from "~design-system";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore/Opportunity";
import { FormLastEdited } from "../FormLastEdited";
import { DenialItem } from "../OpportunityDenial/DropdownMenuButton";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";
import { RevertChangesConfirmationModal } from "../WorkflowsJusticeInvolvedPersonProfile/RevertChangesConfirmationModal";
import { SubmitApprovalModal } from "./SubmitApprovalModal";
import { SubmitRevisionModal } from "./SubmitRevisionModal";
import { createDownloadLabel } from "./utils";

const FormHeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.pine2};
  margin-bottom: ${rem(spacing.lg)};
  position: sticky;
  top: 0;
  background-color: ${palette.pine1};
  z-index: 999;
`;

const FormHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const FormHeading = styled(Sans24)`
  color: ${palette.marble1};
`;

const LastEditedMessage = styled(Sans12)`
  color: ${palette.marble1};
  margin-top: ${rem(spacing.sm)};
`;

const ReviewChainButtons = styled.div`
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${rem(4)};
`;

const StyledSubmitButton = styled(Button)`
  display: flex;
  height: ${rem(40)};
  padding: 0 ${rem(16)};

  align-items: center;
  gap: ${rem(10)};

  border-radius: ${rem(4)};
  background: ${palette.pine4};

  &:disabled {
    cursor: default;
  }
`;

const SubmitButtonText = styled.span`
  color: ${palette.marble1};
  ${typography.Sans12};
  line-height: 100%; /* 12px */
  letter-spacing: ${rem(-0.12)};
`;

const StyledButton = styled(Button).attrs({
  kind: "primary",
  shape: "block",
})`
  background-color: ${rgba(palette.marble1, 0.1)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  width: max-content;
`;

const ActionsDropdownToggle = styled(DropdownToggle)`
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  width: ${rem(16)};
  height: ${rem(16)};

  &:hover,
  &:focus,
  &:active,
  &[aria-expanded="true"] {
    background: transparent;
    border-color: transparent;
    color: inherit;
    outline: none;
  }
`;

const FormContainerElement = styled.div`
  background-color: ${palette.pine1};
  color: ${palette.marble1};
  min-height: 100vh;
  height: 100%;
  padding-bottom: ${rem(spacing.xl)};
`;

const FormPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.xl)} 10%;
  width: 100%;
  height: 100%;
  background-color: ${palette.pine1};
`;

const StyledDropdown = styled(Dropdown)`
  display: flex;
  height: ${rem(40)};
  padding: ${rem(8)} ${rem(12)};
  justify-content: center;
  align-items: center;
  gap: ${rem(8)};

  border-radius: ${rem(4)};
  border: ${rem(1)} solid ${palette.white40};
`;

const ActionsDropdownMenu = styled(DropdownMenu)`
  top: 100%;
`;

const ActionsDropdownMenuItem = styled(DropdownMenuItem)`
  &:disabled {
    cursor: default;
    pointer-events: none;
  }
`;

export type FormHeaderProps = {
  hideLastEditedMessage?: boolean;
  agencyName: string;
  dataProviso?: string;
  heading: string;
  isMissingContent?: boolean;
  onClickDownload: () => Promise<void>;
  downloadTooltip?: string;
  downloadButtonLabel: string;
  hideDownloadButton?: boolean;
  opportunity: Opportunity;
  children: React.ReactNode;
  additionalHeaderButtons?: React.ReactNode;
  onDenialButtonClick?: () => void;
};

export const DownloadButton = StyledButton;
export const RevertButton = StyledButton;
export const SubmitButton = StyledSubmitButton;

export const FormContainer = observer(function FormContainer({
  downloadButtonLabel,
  hideDownloadButton,
  heading,
  isMissingContent,
  onClickDownload,
  downloadTooltip,
  agencyName,
  hideLastEditedMessage,
  dataProviso,
  opportunity,
  children,
  additionalHeaderButtons,
  onDenialButtonClick = () => null,
}: FormHeaderProps): React.ReactElement<any> {
  const { form } = opportunity;
  const isDownloadButtonDisabled = isMissingContent || false;
  const { formRevertButton, hideDenialRevert } = useFeatureVariants();
  const { workflowsStore } = useRootStore();
  const [openModal, setOpenModal] = useState<
    "approval" | "revision" | "revert" | null
  >(null);

  const userHasFilledNecessaryFields = form?.userHasFilledNecessaryFields();

  if (!form) return <div />;

  const revertEditsLabel = opportunity.config.enableSupervisorReviewChain
    ? "Revert All Form Edits"
    : "Revert All Edits";
  const currentlyRevertingLabel = "Reverting...";
  const downloadLabel = createDownloadLabel(
    form.formIsDownloading,
    isDownloadButtonDisabled,
    downloadButtonLabel,
  );

  const shouldHideDenialRevert =
    hideDenialRevert && opportunity.config.hideDenialRevert;
  const showRevertLink =
    !shouldHideDenialRevert &&
    (opportunity.isInSupervisorReview ||
      opportunity.isInRevisionsRequested ||
      opportunity.showRevertLinkFallback);

  const handleUndoAction = async () => {
    await opportunity.handleAdditionalUndoActions();

    if (opportunity.denial) {
      await opportunity.deleteOpportunityDenialAndSnooze();
    } else if (opportunity.isSubmitted) {
      await opportunity.deleteSubmitted();
    }

    if (opportunity.actionHistory?.length) {
      await opportunity.deleteActionHistory();
    }

    if (opportunity.subcategory) {
      toast(
        <OpportunityStatusUpdateToast
          toastText={`${opportunity.person.displayName} is marked as "${opportunity.subcategoryHeadingFor(opportunity.subcategory)}" in the ${opportunity.tabTitle()} tab for ${opportunity.config.label}`}
        />,
        { position: "bottom-left", duration: 7000 },
      );
    } else {
      toast(
        <OpportunityStatusUpdateToast
          toastText={`${opportunity.person.displayName} is now in the ${opportunity.tabTitle()} tab for ${opportunity.config.label}`}
        />,
        { position: "bottom-left", duration: 7000 },
      );
    }
  };

  const handleUndoClick = () => {
    if (opportunity.requiresRevertConfirmation) {
      setOpenModal("revert");
    } else {
      handleUndoAction();
    }
  };

  const handleDownloadClick = async () => {
    form.markDownloading();

    await form.waitForPendingUpdates();

    try {
      if (!isMissingContent) {
        await onClickDownload();
        const message = await form.recordSuccessfulDownload();
        if (message) {
          toast(message, { position: "bottom-left" });
        }
      }
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      form.formIsDownloading = false;
    }
  };

  return (
    <FormContainerElement>
      <FormHeaderBar>
        <FormHeaderSection>
          <div>
            <FormHeading>{heading}</FormHeading>
            {!hideLastEditedMessage && (
              <LastEditedMessage>
                <FormLastEdited
                  agencyName={agencyName}
                  dataProviso={dataProviso}
                  form={form}
                  darkMode
                />
              </LastEditedMessage>
            )}
          </div>
        </FormHeaderSection>
        {opportunity.config.enableSupervisorReviewChain ? (
          <>
            <ReviewChainButtons>
              <TooltipTrigger
                contents={
                  !userHasFilledNecessaryFields
                    ? "Add Signature, Date, and Recommendation to form"
                    : undefined
                }
              >
                <SubmitButton
                  disabled={!userHasFilledNecessaryFields}
                  onClick={() => setOpenModal("approval")}
                >
                  <SubmitButtonText>Submit</SubmitButtonText>
                </SubmitButton>
              </TooltipTrigger>
              <StyledDropdown>
                <ActionsDropdownToggle>
                  <Icon kind="TripleDot" size={16} color={palette.white70} />
                </ActionsDropdownToggle>
                <ActionsDropdownMenu alignment="right">
                  <ActionsDropdownMenuItem
                    disabled={!opportunity.isInSupervisorReview}
                    onClick={() => setOpenModal("revision")}
                  >
                    Send Back for Revisions
                  </ActionsDropdownMenuItem>
                  {!hideDownloadButton && (
                    <ActionsDropdownMenuItem
                      disabled={
                        isDownloadButtonDisabled || form.formIsDownloading
                      }
                      onClick={handleDownloadClick}
                    >
                      {downloadLabel}
                    </ActionsDropdownMenuItem>
                  )}
                  {formRevertButton && form.allowRevert && (
                    <ActionsDropdownMenuItem
                      disabled={!form.formLastUpdated || form.formIsReverting}
                      onClick={() => form.revert()}
                    >
                      {form.formIsReverting
                        ? currentlyRevertingLabel
                        : revertEditsLabel}
                    </ActionsDropdownMenuItem>
                  )}
                  {opportunity.config.supportsDenial && (
                    <DenialItem
                      opportunity={opportunity}
                      onDenialButtonClick={onDenialButtonClick}
                    />
                  )}
                  {showRevertLink && (
                    <ActionsDropdownMenuItem onClick={handleUndoClick}>
                      Revert from {opportunity.tabTitle()}
                    </ActionsDropdownMenuItem>
                  )}
                </ActionsDropdownMenu>
              </StyledDropdown>
            </ReviewChainButtons>
            <SubmitApprovalModal
              showModal={openModal === "approval"}
              onCloseFn={() => setOpenModal(null)}
              opportunity={opportunity}
              workflowsStore={workflowsStore}
            />
            <SubmitRevisionModal
              showModal={openModal === "revision"}
              onCloseFn={() => setOpenModal(null)}
              opportunity={opportunity}
              workflowsStore={workflowsStore}
            />
            <RevertChangesConfirmationModal
              showModal={openModal === "revert"}
              onConfirm={() => {
                handleUndoAction();
                setOpenModal(null);
              }}
              onCancel={() => setOpenModal(null)}
              {...opportunity.revertConfirmationCopy}
            />
          </>
        ) : (
          <FormHeaderSection>
            {formRevertButton && form.allowRevert && (
              <RevertButton
                disabled={!form.formLastUpdated || form.formIsReverting}
                className="WorkflowsFormRevertButton"
                onClick={() => form.revert()}
              >
                {form.formIsReverting
                  ? currentlyRevertingLabel
                  : revertEditsLabel}
              </RevertButton>
            )}
            {additionalHeaderButtons}
            {!hideDownloadButton && (
              <TooltipTrigger contents={downloadTooltip}>
                <DownloadButton
                  className="WorkflowsFormDownloadButton"
                  disabled={isDownloadButtonDisabled || form.formIsDownloading}
                  onClick={handleDownloadClick}
                >
                  {downloadLabel}
                </DownloadButton>
              </TooltipTrigger>
            )}
          </FormHeaderSection>
        )}
      </FormHeaderBar>
      <FormPreviewContainer>{children}</FormPreviewContainer>
    </FormContainerElement>
  );
});
