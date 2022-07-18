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

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  Icon,
  IconSVG,
  palette,
  spacing,
} from "@recidiviz/design-system";
import { debounce, xor } from "lodash";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { OTHER_KEY } from "../../../PracticesStore";
import { ClientProfileProps } from "../types";
import { STATUS_COLORS, useStatusColors } from "./common";

const REASONS_MAP = {
  DECF: "No effort to pay fine and costs",
  DECR: "Criminal record",
  DECT: "Insufficient time in supervision level",
  DEDF: "No effort to pay fees",
  DEDU: "Serious compliance problems ",
  DEIJ: "Not allowed per court",
  DEIR: "Failure to report as instructed",
  [OTHER_KEY]: "Please specify a reason",
};

const Wrapper = styled.div`
  flex: 1 1 auto;
`;

const OtherLabel = styled.label`
  color: ${STATUS_COLORS.ineligible.text};
  display: block;
  margin-top: ${rem(spacing.sm)};
`;

const OtherInput = styled.input.attrs({ type: "text" })`
  background: transparent;
  border: 1px solid ${palette.slate30};
  border-radius: ${rem(4)};
  display: block;
  margin-top: ${rem(spacing.xs)};
  width: 100%;

  &:focus {
    border-color: ${STATUS_COLORS.ineligible.border};
  }
`;

export const IconPad = styled.span`
  display: inline-block;
  margin-right: 8px;
`;

const Checkmark: React.FC = () => {
  return (
    <IconPad>
      <Icon kind={IconSVG.Check} size={12} />
    </IconPad>
  );
};

const StatusAwareButton = styled(DropdownToggle).attrs({
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

export const CompliantReportingDenial = observer(
  ({ client }: ClientProfileProps) => {
    const colors = useStatusColors(client);

    if (!client.opportunitiesEligible.compliantReporting) return null;

    const reasons = client.updates?.compliantReporting?.denial?.reasons;

    const buttonProps = {
      background: colors.background,
      border: reasons?.length ? colors.border : undefined,
      textColor: reasons?.length ? colors.text : undefined,
    };

    let buttonText = "Not currently eligible?";
    if (reasons?.length) {
      buttonText = `${reasons[0]}${
        reasons.length > 1 ? ` + ${reasons.length - 1} more` : ""
      }`;
    }

    return (
      <Wrapper>
        <Dropdown>
          <StatusAwareButton {...buttonProps}>{buttonText}</StatusAwareButton>
          <DropdownMenu>
            {Object.entries(REASONS_MAP).map(([code, desc]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => {
                  client.setCompliantReportingDenialReasons(
                    xor(reasons, [code]).sort()
                  );
                }}
              >
                {reasons?.includes(code) ? <Checkmark /> : null}
                {code}: {desc}
              </DropdownMenuItem>
            ))}
          </DropdownMenu>
        </Dropdown>
        {reasons?.includes(OTHER_KEY) && (
          <OtherLabel>
            Other ineligibility reason:
            <OtherInput
              defaultValue={
                client.updates?.compliantReporting?.denial?.otherReason
              }
              placeholder="Please specify …"
              onChange={debounce(
                (event) =>
                  client.setCompliantReportingDenialOtherReason(
                    event.target.value
                  ),
                500
              )}
            />
          </OtherLabel>
        )}
      </Wrapper>
    );
  }
);
