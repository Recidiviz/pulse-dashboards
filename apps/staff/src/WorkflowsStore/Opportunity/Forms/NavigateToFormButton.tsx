// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { Button, ButtonProps, spacing } from "@recidiviz/design-system";
import { darken, rem } from "polished";
import { Link, LinkProps } from "react-router-dom";
import styled from "styled-components/macro";

import { desktopLinkGate } from "../../../core/desktopLinkGate";
import { OPPORTUNITY_STATUS_COLORS } from "../../../core/utils/workflowsUtils";
import { workflowsUrl } from "../../../core/views";
import { JusticeInvolvedPerson } from "../../types";
import { OpportunityType } from "../OpportunityConfigs";

const NavigateToFormButtonStyle = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${OPPORTUNITY_STATUS_COLORS.eligible.buttonFill};
  border-radius: 4px;
  border: 1px solid ${OPPORTUNITY_STATUS_COLORS.eligible.buttonFill};
  max-height: 32px;
  min-height: 32px;
  max-width: ${rem(175)};
  padding: ${rem(spacing.md)} 0;

  &:hover,
  &:focus {
    background: ${darken(0.1, OPPORTUNITY_STATUS_COLORS.eligible.buttonFill)};
    border: 1px solid
      ${darken(0.1, OPPORTUNITY_STATUS_COLORS.eligible.buttonFill)};
  }
`;

type NavigateToFormButtonProps = Omit<LinkProps, "to" | "onClick"> &
  Partial<ButtonProps> & {
    opportunityType: OpportunityType;
    pseudonymizedId: JusticeInvolvedPerson["pseudonymizedId"];
  };

export function NavigateToFormButton({
  children,
  opportunityType,
  pseudonymizedId,
  onClick,
  ...props
}: React.PropsWithChildren<NavigateToFormButtonProps>): JSX.Element {
  const linkToForm = workflowsUrl("opportunityAction", {
    opportunityType,
    justiceInvolvedPersonId: pseudonymizedId,
  });

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      return onClick(e);
    }

    return desktopLinkGate({
      headline: "Referral Unavailable in Mobile View",
    })(e);
  };

  return (
    <Link
      {...props}
      to={linkToForm}
      aria-label="Navigate to form link"
      className="NavigateToFormLink"
    >
      <NavigateToFormButtonStyle
        className="NavigateToFormButton"
        onClick={handleOnClick}
      >
        {children}
      </NavigateToFormButtonStyle>
    </Link>
  );
}