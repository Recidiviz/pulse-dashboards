// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { Opportunity } from "../../WorkflowsStore";
import { desktopLinkGate } from "../desktopLinkGate";
import { OpportunityDenialDropdown } from "../OpportunityDenial";
import { MenuButton } from "../OpportunityDenial/MenuButton";
import { useStatusColors } from "../utils/workflowsUtils";
import { workflowsUrl } from "../views";
import { TextLink } from "../WorkflowsMilestones/styles";
import { CriteriaList } from "./CriteriaList";
import MarkedIneligibleReasons, {
  buildSnoozedByTextAndResurfaceText,
} from "./MarkedIneligibleReasons";
import { OpportunityModuleHeader } from "./OpportunityModuleHeader";

const Wrapper = styled.div<{
  background: string;
  border: string;
  responsiveRevamp: boolean;
}>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-color: ${({ border: borderColor }) => borderColor};
  border-style: solid;
  border-width: 1px 0;
  color: ${palette.pine1};

  margin: ${({ responsiveRevamp }) =>
    responsiveRevamp ? 0 : `0 -${rem(spacing.lg)}`};
  padding: ${({ responsiveRevamp }) =>
    responsiveRevamp
      ? rem(spacing.md)
      : `${rem(spacing.md)} ${rem(spacing.lg)}`};
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
    const { responsiveRevamp } = useFeatureVariants();
    const { isLaptop } = useIsMobile(true);

    useEffect(() => {
      opportunity.setLastViewed();
    }, [opportunity]);

    const colors = useStatusColors(opportunity);
    const showDenialButton = opportunity.supportsDenial;

    const snoozeUntil: Date | undefined =
      opportunity.manualSnoozeUntilDate ??
      (opportunity?.autoSnooze?.snoozeUntil
        ? parseISO(opportunity?.autoSnooze?.snoozeUntil)
        : undefined);

    const [snoozedByText, resurfaceText] = buildSnoozedByTextAndResurfaceText(
      opportunity,
      snoozeUntil
    );

    const handleUndoClick = async () => {
      await opportunity.deleteOpportunityDenialAndSnooze();
    };

    return (
      <Wrapper responsiveRevamp={!!responsiveRevamp} {...colors}>
        {!hideHeader && <OpportunityModuleHeader opportunity={opportunity} />}
        <CriteriaList opportunity={opportunity} />
        {!!responsiveRevamp && showDenialButton && (
          <MarkedIneligibleReasons
            opportunity={opportunity}
            snoozedByTextAndResurfaceTextPair={[snoozedByText, resurfaceText]}
            denialReasons={opportunity.denial?.reasons}
          />
        )}
        {(showDenialButton || formLinkButton) && (
          <ActionButtons isMobile={!!responsiveRevamp && isLaptop}>
            {formLinkButton && opportunity?.form && (
              <Link
                to={workflowsUrl("opportunityAction", {
                  opportunityType: opportunity.type,
                  justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
                })}
              >
                <FormActionButton
                  className="NavigateToFormButton"
                  buttonFill={colors.buttonFill}
                  onClick={
                    responsiveRevamp
                      ? desktopLinkGate({
                          headline: "Referral Unavailable in Mobile View",
                        })
                      : undefined
                  }
                >
                  {opportunity.form.navigateToFormText}
                </FormActionButton>
              </Link>
            )}
            {responsiveRevamp
              ? showDenialButton &&
                onDenialButtonClick && (
                  <>
                    <MenuButton
                      responsiveRevamp={!!responsiveRevamp}
                      opportunity={opportunity}
                      onDenialButtonClick={onDenialButtonClick}
                    />
                    {snoozedByText && resurfaceText && (
                      <RevertChangesButtonLink onClick={handleUndoClick}>
                        Revert Changes
                      </RevertChangesButtonLink>
                    )}
                  </>
                )
              : showDenialButton && (
                  <>
                    <OpportunityDenialDropdown opportunity={opportunity} />(
                    {snoozedByText && resurfaceText && (
                      <RevertChangesButtonLink onClick={handleUndoClick}>
                        Revert Changes
                      </RevertChangesButtonLink>
                    )}
                    )
                  </>
                )}
          </ActionButtons>
        )}
      </Wrapper>
    );
  }
);
