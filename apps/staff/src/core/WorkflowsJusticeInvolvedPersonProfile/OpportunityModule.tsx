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

import { Button, spacing, typography } from "@recidiviz/design-system";
import { parseISO } from "date-fns";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useParams } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  Opportunity,
  UsArInstitutionalWorkerStatusOpportunity,
} from "../../WorkflowsStore";
import { getLinkToForm } from "../../WorkflowsStore/utils";
import { desktopLinkGate } from "../desktopLinkGate";
import { MenuButton } from "../OpportunityDenial/MenuButton";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";
import { useStatusColors } from "../utils/workflowsUtils";
import { WORKFLOWS_PATHS } from "../views";
import { TextLink } from "../WorkflowsMilestones/styles";
import { CriteriaList } from "./CriteriaList";
import MarkedIneligibleReasons, {
  buildActedOnTextAndResurfaceText,
} from "./MarkedIneligibleReasons";
import { OpportunityModuleHeader } from "./OpportunityModuleHeader";
import { RevertChangesConfirmationModal } from "./RevertChangesConfirmationModal";
import { UsArApprovedVisitors } from "./UsAr/UsARApprovedVisitors";

const Wrapper = styled.div<{
  background: string;
  border: string;
}>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-color: ${({ border: borderColor }) => borderColor};
  border-style: solid;
  border-width: 1px 0;
  color: ${palette.pine1};
  margin: 0;
  padding: ${rem(spacing.md)};
`;

const ActionButtons = styled.div<{ isMobile: boolean }>`
  margin-top: ${rem(spacing.md)};
  display: flex;
  align-items: baseline;
  gap: ${({ isMobile }) => (isMobile ? rem(spacing.sm) : rem(spacing.sm))};
  flex-direction: ${({ isMobile }) => (isMobile ? "column" : "row")};
`;

const FormActionButton = styled(Button).attrs({
  kind: "primary",
  shape: "block",
})<{
  buttonFill: string;
}>`
  background: ${(props) => props.buttonFill};
  margin-right: ${rem(spacing.sm)};
  height: 40px;
  padding: ${rem(spacing.xs)} ${rem(spacing.md)};

  &:hover,
  &:focus {
    background: ${(props) => darken(0.1, props.buttonFill)};
  }
`;

const RevertChangesButtonLink = styled(TextLink)`
  ${typography.Sans14};
  color: ${palette.slate70};
  &:hover {
    color: ${palette.slate};
  }
`;

type OpportunityModuleProps = {
  formLinkButton?: boolean;
  // form-related features (e.g. download button) are optional, but the corresponding fields
  // do need to be hydrated if you are trying to use any of them
  isVisible?: boolean;
  opportunity: Opportunity;
  hideHeader?: boolean;
  hideActionButtons?: boolean;
  shouldTrackOpportunityPreviewed?: boolean;
  onDenialButtonClick?: () => void;
};

export const OpportunityModule: React.FC<OpportunityModuleProps> = observer(
  function OpportunityModule({
    formLinkButton,
    isVisible,
    opportunity,
    hideHeader = false,
    hideActionButtons = false,
    shouldTrackOpportunityPreviewed = true,
    onDenialButtonClick = () => null,
  }) {
    const { tenantStore } = useRootStore();

    const { hideDenialRevert } = useFeatureVariants();

    // We use isLaptop here, rather than isTablet or isMobile, as we've seen issues with profile formatting
    // on screen sizes smaller than desktop.
    const { isLaptop } = useIsMobile(true);

    const { pathname } = useLocation();
    const { officerPseudoId } = useParams();

    const [isRevertConfirmationModalOpen, setRevertConfirmationModalOpen] =
      useState(false);

    useEffect(() => {
      if (isVisible) {
        if (pathname.startsWith(WORKFLOWS_PATHS.workflows)) {
          // Only set last viewed from workflows, not from insights
          opportunity.setLastViewed();
        }
        if (shouldTrackOpportunityPreviewed) {
          opportunity.trackPreviewed();
        }
      }
    }, [opportunity, isVisible, pathname, shouldTrackOpportunityPreviewed]);

    const colors = useStatusColors(opportunity);
    const showUpdateStatusButton =
      opportunity.config.supportsDenial || opportunity.config.supportsSubmitted;

    const snoozeUntil: Date | undefined =
      opportunity.manualSnoozeUntilDate ??
      (opportunity?.autoSnooze?.snoozeUntil
        ? parseISO(opportunity?.autoSnooze?.snoozeUntil)
        : undefined);

    const [actedOnText, resurfaceText] = buildActedOnTextAndResurfaceText(
      opportunity,
      snoozeUntil,
      tenantStore.labels,
    );

    const hasActedOnAndResurfaceText = actedOnText && resurfaceText;

    const shouldHideDenialRevert =
      hideDenialRevert && opportunity.config.hideDenialRevert;

    const denialRevertEnabled =
      !shouldHideDenialRevert && hasActedOnAndResurfaceText;

    const showRevertLink =
      denialRevertEnabled ||
      opportunity.isSubmitted ||
      opportunity.showRevertLinkFallback;

    const showActionButtons =
      (showUpdateStatusButton || formLinkButton) && !hideActionButtons;

    const handleUndoAction = async () => {
      await opportunity.handleAdditionalUndoActions();

      if (opportunity.denial) {
        await opportunity.deleteOpportunityDenialAndSnooze();
      } else if (opportunity.isSubmitted) {
        await opportunity.deleteSubmitted();
      }

      if (opportunity.subcategory) {
        toast(
          <OpportunityStatusUpdateToast
            toastText={`${opportunity.person.displayName} is marked as "${opportunity.subcategoryHeadingFor(opportunity.subcategory)}" in the ${opportunity.tabTitle()} tab for ${opportunity.config.label}`}
          />,
          {
            position: "bottom-left",
            duration: 7000,
          },
        );
      } else {
        toast(
          <OpportunityStatusUpdateToast
            toastText={`${opportunity.person.displayName} is now in the ${opportunity.tabTitle()} tab for ${opportunity.config.label}`}
          />,
          {
            position: "bottom-left",
            duration: 7000,
          },
        );
      }
    };

    const handleUndoClick = () => {
      if (opportunity.requiresRevertConfirmation) {
        setRevertConfirmationModalOpen(true);
      } else {
        handleUndoAction();
      }
    };

    const linkToForm = getLinkToForm(pathname, opportunity, officerPseudoId);

    return (
      <Wrapper {...colors}>
        {!hideHeader && <OpportunityModuleHeader opportunity={opportunity} />}
        <CriteriaList opportunity={opportunity} />
        {showUpdateStatusButton && (
          <MarkedIneligibleReasons
            opportunity={opportunity}
            actedOnTextAndResurfaceTextPair={[actedOnText, resurfaceText]}
            denialReasons={opportunity.denial?.reasons}
          />
        )}
        {showActionButtons && (
          <ActionButtons isMobile={isLaptop}>
            {formLinkButton && opportunity?.form && (
              <Link to={linkToForm}>
                <FormActionButton
                  className="NavigateToFormButton"
                  buttonFill={colors.buttonFill}
                  onClick={desktopLinkGate({
                    headline: "Referral Unavailable in Mobile View",
                  })}
                >
                  {opportunity.form.navigateToFormText}
                </FormActionButton>
              </Link>
            )}
            {showUpdateStatusButton && onDenialButtonClick && (
              <>
                <MenuButton
                  opportunity={opportunity}
                  onDenialButtonClick={onDenialButtonClick}
                />
                {showRevertLink && (
                  <RevertChangesButtonLink onClick={handleUndoClick}>
                    Revert Changes
                  </RevertChangesButtonLink>
                )}
              </>
            )}
          </ActionButtons>
        )}
        {opportunity.record?.approvedVisitors &&
          opportunity instanceof UsArInstitutionalWorkerStatusOpportunity && (
            <UsArApprovedVisitors opportunity={opportunity} />
          )}

        {isRevertConfirmationModalOpen && (
          <RevertChangesConfirmationModal
            onConfirm={() => {
              handleUndoAction();
              setRevertConfirmationModalOpen(false);
            }}
            onCancel={() => setRevertConfirmationModalOpen(false)}
            {...opportunity.revertConfirmationCopy}
          />
        )}
      </Wrapper>
    );
  },
);
