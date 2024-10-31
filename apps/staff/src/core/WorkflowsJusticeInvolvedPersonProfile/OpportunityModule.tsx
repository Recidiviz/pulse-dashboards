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

import { Button, palette, spacing, typography } from "@recidiviz/design-system";
import { parseISO } from "date-fns";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useParams } from "react-router-dom";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { Opportunity } from "../../WorkflowsStore";
import { getLinkToForm } from "../../WorkflowsStore/utils";
import { desktopLinkGate } from "../desktopLinkGate";
import { MenuButton } from "../OpportunityDenial/MenuButton";
import { useStatusColors } from "../utils/workflowsUtils";
import { TextLink } from "../WorkflowsMilestones/styles";
import { CriteriaList } from "./CriteriaList";
import MarkedIneligibleReasons, {
  buildActedOnTextAndResurfaceText,
} from "./MarkedIneligibleReasons";
import { OpportunityModuleHeader } from "./OpportunityModuleHeader";

const Wrapper = styled.div<{
  background: string;
  border: string;
}>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-color: ${({ border: borderColor }) => borderColor};
  border-style: solid;
  border-width: 1px 0;
  color: ${palette.pine1};
  margin: $0;
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
  opportunity: Opportunity;
  hideHeader?: boolean;
  onDenialButtonClick?: () => void;
};

export const OpportunityModule: React.FC<OpportunityModuleProps> = observer(
  function OpportunityModule({
    formLinkButton,
    opportunity,
    hideHeader = false,
    onDenialButtonClick = () => null,
  }) {
    const { hideDenialRevert, submittedOpportunityStatus } =
      useFeatureVariants();

    // We use isLaptop here, rather than isTablet or isMobile, as we've seen issues with profile formatting
    // on screen sizes smaller than desktop.
    const { isLaptop } = useIsMobile(true);

    const { pathname } = useLocation();
    const { officerPseudoId } = useParams();

    useEffect(() => {
      opportunity.setLastViewed();
    }, [opportunity]);

    const colors = useStatusColors(opportunity);
    const showUpdateStatusButton =
      opportunity.config.supportsDenial || submittedOpportunityStatus;

    const snoozeUntil: Date | undefined =
      opportunity.manualSnoozeUntilDate ??
      (opportunity?.autoSnooze?.snoozeUntil
        ? parseISO(opportunity?.autoSnooze?.snoozeUntil)
        : undefined);

    const [actedOnText, resurfaceText] = buildActedOnTextAndResurfaceText(
      opportunity,
      snoozeUntil,
    );

    const showRevertLink = !(
      hideDenialRevert && opportunity.config.hideDenialRevert
    );

    const handleUndoClick = async () => {
      if (opportunity.denial) {
        await opportunity.deleteOpportunityDenialAndSnooze();
      } else if (opportunity.isSubmitted) {
        await opportunity.deleteSubmitted();
      }

      if (submittedOpportunityStatus) {
        toast(
          `${opportunity.person.displayName} is now ${opportunity.tabTitle()} for ${opportunity.config.label}`,
          {
            position: "bottom-left",
          },
        );
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
        {(showUpdateStatusButton || formLinkButton) && (
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
                {showRevertLink &&
                  ((actedOnText && resurfaceText) ||
                    opportunity.isSubmitted) && (
                    <RevertChangesButtonLink onClick={handleUndoClick}>
                      Revert Changes
                    </RevertChangesButtonLink>
                  )}
              </>
            )}
          </ActionButtons>
        )}
      </Wrapper>
    );
  },
);
