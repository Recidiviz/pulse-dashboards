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

import { Button, palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { Opportunity } from "../../WorkflowsStore";
import { desktopLinkGate } from "../desktopLinkGate";
import { OpportunityDenialDropdown } from "../OpportunityDenial";
import { MenuButton } from "../OpportunityDenial/MenuButton";
import { useStatusColors } from "../utils/workflowsUtils";
import { workflowsUrl } from "../views";
import { CriteriaList } from "./CriteriaList";
import MarkedIneligibleReasons from "./MarkedIneligibleReasons";
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
  gap: ${({ isMobile }) => (isMobile ? rem(spacing.sm) : 0)};
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

type OpportunityModuleProps = {
  formLinkButton?: boolean;
  formDownloadButton?: boolean;
  // form-related features (e.g. download button) are optional, but the corresponding fields
  // do need to be hydrated if you are trying to use any of them
  opportunity: Opportunity;
  hideHeader?: boolean;
  onDenialButtonClick?: () => void;
};

export const OpportunityModule: React.FC<OpportunityModuleProps> = observer(
  function OpportunityModule({
    formLinkButton,
    formDownloadButton,
    opportunity,
    hideHeader = false,
    onDenialButtonClick = () => null,
  }) {
    const {
      workflowsStore: { featureVariants, currentUserEmail },
    } = useRootStore();
    const { isLaptop } = useIsMobile(true);

    useEffect(() => {
      opportunity.setLastViewed();
    }, [opportunity]);

    const colors = useStatusColors(opportunity);
    const showDenialButton = opportunity.supportsDenial;
    return (
      <Wrapper
        responsiveRevamp={!!featureVariants.responsiveRevamp}
        {...colors}
      >
        {!hideHeader && <OpportunityModuleHeader opportunity={opportunity} />}
        <CriteriaList opportunity={opportunity} />
        {!!featureVariants.responsiveRevamp && showDenialButton && (
          <MarkedIneligibleReasons
            opportunity={opportunity}
            currentUserEmail={currentUserEmail}
          />
        )}
        {(formDownloadButton || showDenialButton || formLinkButton) && (
          <ActionButtons
            isMobile={!!featureVariants.responsiveRevamp && isLaptop}
          >
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
                    featureVariants.responsiveRevamp
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
            {formDownloadButton && opportunity.form && (
              <div>
                <FormActionButton
                  className="WorkflowsFormActionButton"
                  buttonFill={colors.buttonFill}
                  onClick={() => opportunity.form?.markDownloading()}
                >
                  {opportunity.form.downloadText}
                </FormActionButton>
              </div>
            )}
            {featureVariants.responsiveRevamp
              ? showDenialButton &&
                onDenialButtonClick && (
                  <MenuButton
                    responsiveRevamp={!!featureVariants.responsiveRevamp}
                    opportunity={opportunity}
                    onDenialButtonClick={onDenialButtonClick}
                  />
                )
              : showDenialButton && (
                  <OpportunityDenialDropdown opportunity={opportunity} />
                )}
          </ActionButtons>
        )}
      </Wrapper>
    );
  }
);
