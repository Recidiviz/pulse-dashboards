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
  DropdownToggle,
  palette,
  spacing,
} from "@recidiviz/design-system";
import { debounce, xor } from "lodash";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import Checkbox from "../../../components/Checkbox";
import { OTHER_KEY } from "../../../WorkflowsStore";
import { STATUS_COLORS, useStatusColors } from "../common";
import { ClientProfileProps } from "../types";

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

const OtherInputWrapper = styled.div`
  display: block;
  margin: ${rem(spacing.sm)} 2.5rem 2rem;
`;

const OtherInput = styled.textarea.attrs({ type: "text" })`
  background: ${palette.marble3};
  border-radius: ${rem(4)};
  border: 2px solid transparent;
  display: block;
  margin-top: ${rem(spacing.xs)};
  width: 100%;
  min-height: 2rem;

  &:focus {
    border-color: ${STATUS_COLORS.ineligible.border};
  }
`;

export const IconPad = styled.span`
  display: inline-block;
  margin-right: 8px;
`;

const DropdownContainer = styled.div`
  min-width: 21rem;
  min-height: 21rem;
`;

const SelectReasonText = styled.div`
  color: ${palette.slate70};
  padding: 0.5rem 1rem;
`;

const DropdownItem = styled.div<{ first?: boolean }>`
  color: ${(props) => (props.first ? palette.pine3 : palette.pine4)};
  border-bottom: ${(props) =>
    props.first ? `1px solid ${palette.slate20}` : 0};
  padding: ${(props) => (props.first ? "1rem" : "0.25rem 1rem 0.25rem")};

  &:hover {
    background-color: ${palette.slate10};
  }

  > .Checkbox__container {
    height: 100%;
    width: 100%;
    margin-bottom: 0;

    > .Checkbox__label {
      top: 0;
    }

    > .Checkbox__input:checked ~ .Checkbox__box {
      background-color: ${palette.signal.highlight};
      border-color: transparent;
    }

    > .Checkbox__input:checked ~ .Checkbox__box {
      &:hover {
        background-color: ${palette.signal.links};
      }
    }
  }
`;

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
    if (!client.opportunities.compliantReporting) return null;

    const reasons =
      client.opportunityUpdates.compliantReporting?.denial?.reasons;

    const buttonProps = {
      background: colors.background,
      border: reasons?.length ? colors.border : undefined,
      textColor: reasons?.length ? colors.text : undefined,
    };

    let buttonText = "Update eligibility";
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
            <DropdownContainer>
              <DropdownItem first>
                <Checkbox
                  value="eligible"
                  checked={!reasons?.length}
                  name="eligible"
                  onChange={() => {
                    if (reasons?.length) {
                      client.setCompliantReportingDenialReasons([]);
                    }
                  }}
                >
                  Eligible
                </Checkbox>
              </DropdownItem>
              <SelectReasonText>
                Not eligible? Select reason(s):
              </SelectReasonText>
              {Object.entries(REASONS_MAP).map(([code, desc]) => (
                <DropdownItem>
                  <Checkbox
                    value={code}
                    checked={reasons?.includes(code) || false}
                    name="denial reason"
                    onChange={() => {
                      client.setCompliantReportingDenialReasons(
                        xor(reasons, [code]).sort()
                      );
                    }}
                  >
                    {code}: {desc}
                  </Checkbox>
                </DropdownItem>
              ))}

              {reasons?.includes(OTHER_KEY) && (
                <OtherInputWrapper>
                  <OtherInput
                    defaultValue={
                      client.opportunityUpdates.compliantReporting?.denial
                        ?.otherReason
                    }
                    placeholder="Please specify a reason…"
                    onChange={debounce(
                      (event) =>
                        client.setCompliantReportingDenialOtherReason(
                          event.target.value
                        ),
                      500
                    )}
                  />
                </OtherInputWrapper>
              )}
            </DropdownContainer>
          </DropdownMenu>
        </Dropdown>
      </Wrapper>
    );
  }
);
