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
import styled, { createGlobalStyle, css } from "styled-components";

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
import { hideWhenPrintingStyle } from "../sharedComponents";
import { RevertChangesConfirmationModal } from "../WorkflowsJusticeInvolvedPersonProfile/RevertChangesConfirmationModal";
import {
  FORM_LAYOUT_CLASS,
  FORM_SIDEBAR_CLASS,
} from "../WorkflowsLayouts/constants";
import { SubmitApprovalModal } from "./SubmitApprovalModal";
import { SubmitRevisionModal } from "./SubmitRevisionModal";
import { createDownloadLabel } from "./utils";

type PrintableProps = { $printable?: boolean };

const hideOnPrintout = ({ $printable }: PrintableProps) =>
  $printable && hideWhenPrintingStyle;

// The side panel and the page grid belong to WorkflowsFormLayout, which every
// form shares, so a printable form hides them only while it is on the page.
// The layout's own grid rule has the same specificity and comes later in the
// page's styles, so the grid selector names the element to win.
const PrintOnlyTheForm = createGlobalStyle`
  @media print {
    .${FORM_SIDEBAR_CLASS} {
      display: none;
    }

    div.${FORM_LAYOUT_CLASS} {
      grid-template-columns: 1fr;
      min-height: auto;
    }
  }
`;

const FormHeaderBar = styled.div<PrintableProps>`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.pine2};
  margin-bottom: ${rem(spacing.lg)};
  position: sticky;
  top: 0;
  background-color: ${palette.pine1};
  z-index: 999;

  ${({ $printable }) =>
    $printable &&
    css`
      @media print {
        position: static;
        padding: 0 0 ${rem(spacing.md)};
        border-bottom: none;
        background: none;
      }
    `}
`;

const FormHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const FormHeaderActions = styled(FormHeaderSection).attrs({
  role: "group",
  "aria-label": "Form actions",
})<PrintableProps>`
  ${hideOnPrintout}
`;

const FormHeading = styled(Sans24)<PrintableProps>`
  color: ${palette.marble1};

  ${({ $printable }) =>
    $printable &&
    css`
      @media print {
        color: ${palette.pine1};
      }
    `}
`;

const LastEditedMessage = styled(Sans12)<PrintableProps>`
  color: ${palette.marble1};
  margin-top: ${rem(spacing.sm)};

  ${hideOnPrintout}
`;

const ReviewChainButtons = styled.div<PrintableProps>`
  ${hideOnPrintout}
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${rem(4)};
`;

export const SubmitButtonText = styled.span`
  color: ${palette.marble1};
  ${typography.Sans12};
  line-height: 100%; /* 12px */
  letter-spacing: ${rem(-0.12)};
`;

const StyledSubmitButton = styled(Button)`
  display: flex;
  height: ${rem(40)};
  padding: 0 ${rem(16)};

  align-items: center;
  gap: ${rem(10)};

  border-radius: ${rem(4)};
  background: ${palette.pine4};

  &:hover:not(:disabled) {
    background: ${palette.pine3};
  }

  &:active:not(:disabled) {
    background: ${palette.pine2};
  }

  &:disabled {
    cursor: default;
    background: transparent;
    border: 1px solid ${palette.pine3};

    ${SubmitButtonText} {
      color: ${palette.pine4};
    }
  }
`;

export const StyledFormButton = styled(Button).attrs({
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

  &:focus-visible {
    outline: 2px solid ${palette.white70};
    outline-offset: 2px;
  }
`;

const FormContainerElement = styled.div<PrintableProps>`
  background-color: ${palette.pine1};
  color: ${palette.marble1};
  min-height: 100vh;
  height: 100%;
  padding-bottom: ${rem(spacing.xl)};

  ${({ $printable }) =>
    $printable &&
    css`
      @media print {
        min-height: auto;
        padding-bottom: 0;
        background: none;
      }
    `}
`;

const FormPreviewContainer = styled.div<PrintableProps>`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.xl)} 10%;
  width: 100%;
  height: 100%;
  background-color: ${palette.pine1};

  ${({ $printable }) =>
    $printable &&
    css`
      @media print {
        padding: 0;
        background: none;
      }
    `}
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

function FormActionsMenu({ children }: { children: React.ReactNode }) {
  return (
    <StyledDropdown>
      <ActionsDropdownToggle aria-label="More actions">
        <Icon kind="TripleDot" size={16} color={palette.white70} />
      </ActionsDropdownToggle>
      <ActionsDropdownMenu alignment="right">{children}</ActionsDropdownMenu>
    </StyledDropdown>
  );
}

export type FormMenuAction = {
  label: string;
  onClick: () => void;
};

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
  /** Shown in the header's "More actions" menu, after any built-in actions. */
  menuActions?: FormMenuAction[];
  /**
   * Prints the heading in dark text and the form's body on a plain page. The
   * side panel, the header's actions and the "Last edited" message stay on
   * screen; anything else a form doesn't want on paper, it hides itself.
   */
  printable?: boolean;
  /** Rendered in the header bar, below the "Last edited" message. */
  headerBanner?: React.ReactNode;
  onDenialButtonClick?: () => void;
};

export const DownloadButton = StyledFormButton;
export const RevertButton = StyledFormButton;
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
  menuActions = [],
  printable = false,
  headerBanner,
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

    await form.flushPendingInputs();

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

  let submitButtonTooltip = undefined;

  if (!userHasFilledNecessaryFields && opportunity.isInRevisionsRequested) {
    submitButtonTooltip =
      "Edit Name, Signature, Date, Recommendation or Remarks fields";
  } else if (!userHasFilledNecessaryFields) {
    submitButtonTooltip =
      "Add Name, Signature, Date, and Recommendation to form";
  }

  const menuActionItems = menuActions.map(({ label, onClick }) => (
    <ActionsDropdownMenuItem key={label} onClick={onClick}>
      {label}
    </ActionsDropdownMenuItem>
  ));
  const hasMenuActions = menuActionItems.length > 0;

  const showRevertEdits = formRevertButton && form.allowRevert;
  const revertEditsProps = {
    disabled: !form.formLastUpdated || form.formIsReverting,
    onClick: () => form.revert(),
    children: form.formIsReverting ? currentlyRevertingLabel : revertEditsLabel,
  };

  return (
    <FormContainerElement $printable={printable}>
      {printable && <PrintOnlyTheForm />}
      <FormHeaderBar $printable={printable}>
        <FormHeaderSection>
          <div>
            <FormHeading $printable={printable}>{heading}</FormHeading>
            {!hideLastEditedMessage && (
              <LastEditedMessage $printable={printable}>
                <FormLastEdited
                  agencyName={agencyName}
                  dataProviso={dataProviso}
                  form={form}
                  darkMode
                />
              </LastEditedMessage>
            )}
            {headerBanner}
          </div>
        </FormHeaderSection>
        {opportunity.config.enableSupervisorReviewChain ? (
          <>
            <ReviewChainButtons $printable={printable}>
              <TooltipTrigger contents={submitButtonTooltip}>
                <SubmitButton
                  disabled={!userHasFilledNecessaryFields}
                  onClick={() => setOpenModal("approval")}
                >
                  <SubmitButtonText>Submit</SubmitButtonText>
                </SubmitButton>
              </TooltipTrigger>
              <FormActionsMenu>
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
                {showRevertEdits && (
                  <ActionsDropdownMenuItem {...revertEditsProps} />
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
                {menuActionItems}
              </FormActionsMenu>
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
          <FormHeaderActions $printable={printable}>
            {showRevertEdits && !hasMenuActions && (
              <RevertButton
                className="WorkflowsFormRevertButton"
                {...revertEditsProps}
              />
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
            {hasMenuActions && (
              <FormActionsMenu>
                {menuActionItems}
                {showRevertEdits && (
                  <ActionsDropdownMenuItem {...revertEditsProps} />
                )}
              </FormActionsMenu>
            )}
          </FormHeaderActions>
        )}
      </FormHeaderBar>
      <FormPreviewContainer $printable={printable}>
        {children}
      </FormPreviewContainer>
    </FormContainerElement>
  );
});
