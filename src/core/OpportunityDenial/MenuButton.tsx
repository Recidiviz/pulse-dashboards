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

import { Button, DropdownToggle } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { darken } from "polished";
import styled from "styled-components/macro";

import { Opportunity } from "../../WorkflowsStore";
import { useStatusColors } from "../utils/workflowsUtils";

const StatusAwareDropdownToggle = styled(DropdownToggle).attrs({
  kind: "secondary",
  shape: "block",
  showCaret: true,
})<{ background: string; border?: string; textColor?: string }>`
  ${(props) => (props.border ? `border-color: ${props.border};` : "")}
  ${(props) => (props.textColor ? `color: ${props.textColor};` : "")}

  &:hover,
  &:focus {
    background-color: ${(props) => props.background};
  }

  &:active,
  &[aria-expanded="true"] {
    ${(props) =>
      props.border ? `border-color: ${darken(0.2, props.border)};` : ""}
  }
`;

const StatusAwareButton = styled(Button).attrs({
  kind: "secondary",
  shape: "block",
})`
  max-width: 10rem;
`;

export const MenuButton = observer(function MenuButton({
  opportunity,
  onDenialButtonClick = () => null,
  responsiveRevamp = false,
}: {
  opportunity: Opportunity;
  onDenialButtonClick?: () => void;
  responsiveRevamp?: boolean;
}) {
  const colors = useStatusColors(opportunity);

  const reasons = opportunity.denial?.reasons;

  const buttonProps = {
    background: colors.background,
    border: reasons?.length ? colors.border : undefined,
    textColor: reasons?.length ? colors.text : undefined,
  };

  let buttonText = opportunity.isAlert ? "Override?" : "Update eligibility";
  if (reasons?.length && !responsiveRevamp) {
    buttonText = `${reasons[0]}${
      reasons.length > 1 ? ` + ${reasons.length - 1} more` : ""
    }`;
  }

  if (!responsiveRevamp) {
    return (
      <StatusAwareDropdownToggle {...buttonProps}>
        {buttonText}
      </StatusAwareDropdownToggle>
    );
  }
  return (
    <StatusAwareButton onClick={onDenialButtonClick}>
      {buttonText}
    </StatusAwareButton>
  );
});
