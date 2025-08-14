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

import { ButtonProps, spacing } from "@recidiviz/design-system";
import { darken, rem } from "polished";
import { Link, LinkProps, useLocation, useParams } from "react-router-dom";
import styled from "styled-components/macro";

import { Button } from "~design-system";

import { desktopLinkGate } from "../../../core/desktopLinkGate";
import { useStatusColors } from "../../../core/utils/workflowsUtils";
import { getLinkToForm } from "../../utils";
import { Opportunity } from "..";

export const NavigateToFormButtonStyle = styled(Button).attrs({
  kind: "primary",
  shape: "block",
})<{
  buttonFill: string;
}>`
  display: inline;
  background: ${(props) => props.buttonFill};
  height: 40px;
  max-width: ${rem(200)};
  padding: ${rem(spacing.xs)} ${rem(spacing.md)};

  &:hover,
  &:focus {
    background: ${(props) => darken(0.1, props.buttonFill)};
  }
`;

type NavigateToFormButtonProps = Omit<LinkProps, "to" | "onClick"> &
  Partial<ButtonProps> & {
    opportunity: Opportunity;
  };

export function NavigateToFormButton({
  children,
  opportunity,
  onClick, // unused: we just don't want it in the ...props
  style,
  ...props
}: React.PropsWithChildren<NavigateToFormButtonProps>): JSX.Element {
  const { pathname } = useLocation();
  const { officerPseudoId } = useParams();
  const { buttonFill } = useStatusColors(opportunity);

  const handleOnClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (opportunity.config.skipFormPreview) {
      opportunity.form?.download();
      e.stopPropagation();
    } else {
      desktopLinkGate({
        headline: "Referral Unavailable in Mobile View",
      })(e);
    }
  };

  const button = (
    <NavigateToFormButtonStyle
      style={style}
      buttonFill={buttonFill}
      className="NavigateToFormButton"
      onClick={handleOnClick}
    >
      {children}
    </NavigateToFormButtonStyle>
  );

  if (opportunity.config.skipFormPreview) return button;

  const linkToForm = getLinkToForm(pathname, opportunity, officerPseudoId);

  return (
    <Link
      {...props}
      to={linkToForm}
      aria-label="Navigate to form link"
      className="NavigateToFormLink"
    >
      {button}
    </Link>
  );
}
