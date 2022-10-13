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
  palette,
  spacing,
} from "@recidiviz/design-system";
import { debounce, xor } from "lodash";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import Checkbox from "../../components/Checkbox/Checkbox";
import { Opportunity, OTHER_KEY } from "../../WorkflowsStore";
import { STATUS_COLORS, useStatusColors } from "./common";

const Wrapper = styled.div`
  flex: 1 1 auto;
`;

const OtherInputWrapper = styled.div`
  display: block;
  margin: ${rem(spacing.sm)} 2.5rem 1rem;
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
  min-height: 17rem;
  margin-bottom: 1rem;

  > button {
    background-color: transparent;
    padding: 0;

    &:hover,
    &:focus,
    &:active {
      background-color: transparent;
    }

    &:focus {
      .Checkbox__box {
      background-color: ${palette.slate10};
    }
  }
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

  > .Checkbox__container {
    height: 100%;
    width: 100%;
    margin-bottom: 0;

    &:hover {
      > .Checkbox__box {
        background-color: ${palette.slate10};
      }

      > .Checkbox__input:checked ~ .Checkbox__box {
        background-color: ${palette.signal.links};
      }
    }

    > .Checkbox__label {
      top: -7px;
    }

    > .Checkbox__box {
      border-radius: 3px;
    }

    > .Checkbox__input:checked ~ .Checkbox__box {
      background-color: ${palette.signal.highlight};
      border-color: transparent;
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

export const OpportunityDenial = observer(
  ({ opportunity }: { opportunity: Opportunity }) => {
    if (!opportunity) return null;
    const colors = useStatusColors(opportunity);

    const reasons = opportunity.denial?.reasons;

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
              <DropdownMenuItem
                onClick={() => {
                  if (reasons?.length) {
                    opportunity.client.setOpportunityDenialReasons(
                      [],
                      opportunity.type
                    );
                  }
                }}
                preventCloseOnClickEvent
              >
                <DropdownItem>
                  <Checkbox
                    value="eligible"
                    checked={!reasons?.length}
                    name="eligible"
                    onChange={() => {
                      return undefined;
                    }}
                  >
                    Eligible
                  </Checkbox>
                </DropdownItem>
              </DropdownMenuItem>
              <SelectReasonText>
                Not eligible? Select reason(s):
              </SelectReasonText>
              {Object.entries(opportunity?.denialReasonsMap).map(
                ([code, desc]) => (
                  <DropdownMenuItem
                    onClick={() => {
                      opportunity.client.setOpportunityDenialReasons(
                        xor(reasons, [code]).sort(),
                        opportunity.type
                      );
                    }}
                    preventCloseOnClickEvent
                  >
                    <DropdownItem>
                      <Checkbox
                        value={code}
                        checked={reasons?.includes(code) || false}
                        name="denial reason"
                        onChange={() => {
                          return undefined;
                        }}
                        disabled
                      >
                        {desc}
                      </Checkbox>
                    </DropdownItem>
                  </DropdownMenuItem>
                )
              )}

              {reasons?.includes(OTHER_KEY) && (
                <OtherInputWrapper>
                  <OtherInput
                    defaultValue={opportunity.denial?.otherReason}
                    placeholder="Please specify a reason…"
                    onChange={debounce(
                      (event) =>
                        opportunity.client.setOpportunityOtherReason(
                          opportunity.type,
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
