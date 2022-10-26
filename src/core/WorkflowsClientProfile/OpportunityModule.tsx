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

import { Opportunity } from "../../WorkflowsStore";
import { OpportunityDenial } from "../OpportunityDenial";
import { useStatusColors } from "../utils/workflowsUtils";
import { workflowsUrl } from "../views";
import { CriteriaList } from "./CriteriaList";
import { OpportunityModuleHeader } from "./OpportunityModuleHeader";

const Wrapper = styled.div<{ background: string; border: string }>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-color: ${({ border: borderColor }) => borderColor};
  border-style: solid;
  border-width: 1px 0;
  color: ${palette.pine1};
  margin: 0 -${rem(spacing.lg)};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
`;

const ActionButtons = styled.div`
  margin-top: ${rem(spacing.md)};
  display: flex;
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
  formPrintButton?: boolean;
  // form-related features (e.g. print button) are optional, but the corresponding fields
  // do need to be hydrated if you are trying to use any of them
  opportunity: Opportunity;
  hideHeader?: boolean;
};

export const OpportunityModule: React.FC<OpportunityModuleProps> = observer(
  ({ formLinkButton, formPrintButton, opportunity, hideHeader = false }) => {
    useEffect(() => {
      opportunity.setFirstViewedIfNeeded();
    }, [opportunity]);

    const colors = useStatusColors(opportunity);
    const showDenialButton = opportunity.supportsDenial;
    return (
      <Wrapper {...colors}>
        {!hideHeader && <OpportunityModuleHeader opportunity={opportunity} />}
        <CriteriaList opportunity={opportunity} />
        {(formPrintButton || showDenialButton || formLinkButton) && (
          <ActionButtons>
            {formLinkButton && opportunity.navigateToFormText && (
              <Link
                to={workflowsUrl("opportunityAction", {
                  opportunityType: opportunity.type,
                  clientId: opportunity.client.pseudonymizedId,
                })}
              >
                <FormActionButton buttonFill={colors.buttonFill}>
                  {opportunity.navigateToFormText}
                </FormActionButton>
              </Link>
            )}
            {formPrintButton && opportunity.printText && (
              <div>
                <FormActionButton
                  buttonFill={colors.buttonFill}
                  onClick={() =>
                    opportunity.client.printReferralForm(opportunity.type)
                  }
                >
                  {opportunity.printText}
                </FormActionButton>
              </div>
            )}

            {showDenialButton && (
              <OpportunityDenial opportunity={opportunity} />
            )}
          </ActionButtons>
        )}
      </Wrapper>
    );
  }
);
