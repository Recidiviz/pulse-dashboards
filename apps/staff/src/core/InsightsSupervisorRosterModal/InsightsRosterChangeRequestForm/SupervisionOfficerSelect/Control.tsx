// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
  DropdownToggle as DropdownToggleButton,
  palette,
  typography,
} from "@recidiviz/design-system";
import { memoize } from "lodash";
import { rem } from "polished";
import React from "react";
import DropdownItem from "react-bootstrap/esm/DropdownItem";
import { components, ControlProps } from "react-select";
import styled from "styled-components/macro";

import { RosterChangeRequest, rosterChangeRequestSchema } from "~datatypes";

import { humanReadableTitleCase } from "../../../../utils";
import { SelectOption } from "../../../CaseloadSelect";
import {
  FlexWrapper,
  SelectedCheckmarkIndicator,
} from "../../../OpportunityCaseloadView/OpportunityTypeSelect";

const StyledDropdownMenuItem = styled(DropdownMenuItem)`
  ${typography.Sans14}
  height: ${rem(28)};
  color: ${palette.pine1};
  min-width: ${rem(116)};
  :hover {
    background-color: ${palette.pine4};
    color: ${palette.white};
  }
`;

const StyledDropdownMenu = styled(DropdownMenu)`
  padding-top: ${rem(8)};
  padding-bottom: ${rem(8)};
  max-width: ${rem(116)};
  width: ${rem(116)};
  min-width: ${rem(116)};
`;

/**
 * Custom Control component for the ReactSelect input.
 *
 * This component renders a custom control for selecting a roster change request action.
 * It displays the current `requestChangeType` and renders a dropdown menu containing
 * available officers.
 *
 * It calls `setValue` to update the request change type.
 *
 * @param requestChangeType - The current request change type (e.g., "ADD", "REMOVE").
 * @param setValue - Callback to update the request change type.
 *
 *
 * @returns A function that accepts control props and returns the custom control component.
 *
 * References
 * - {@link https://react-select.com/components#:~:text=Custom%20Control%20Example}
 */
export const Control = memoize( // Must be wrapped in memoize to avoid unnecessary rerenders
  (
    requestChangeType: RosterChangeRequest["requestChangeType"],
    setValue: (value: RosterChangeRequest["requestChangeType"]) => void,
  ) =>
    function Control({ children, ...props }: ControlProps<SelectOption, true>) {
      const handleSetValue =
        (val: RosterChangeRequest["requestChangeType"]) => () => {
          setValue(val);
          props.clearValue();
        };

      return (
        <components.Control {...props}>
          {children}
          <Dropdown>
            <DropdownToggleButton
              style={{
                color: palette.pine1,
              }}
              {...({ as: DropdownToggleButton } as any)}
              showCaret
              kind="borderless"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
            >
              {humanReadableTitleCase(requestChangeType)}
            </DropdownToggleButton>
            <StyledDropdownMenu alignment="right">
              {rosterChangeRequestSchema.shape.requestChangeType.options.map(
                (action) => {
                  const selected = requestChangeType === action;

                  return (
                    <StyledDropdownMenuItem
                      as={DropdownItem}
                      key={action}
                      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.stopPropagation();
                        if (!selected) handleSetValue(action)();
                      }}
                      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.stopPropagation();
                      }}
                      // Touch screen
                      onTouchEnd={(e: React.TouchEvent<HTMLDivElement>) => {
                        e.stopPropagation();
                        if (!selected) handleSetValue(action)();
                      }}
                    >
                      <FlexWrapper>
                        <div>{humanReadableTitleCase(action)}</div>
                        {selected && <SelectedCheckmarkIndicator />}
                      </FlexWrapper>
                    </StyledDropdownMenuItem>
                  );
                },
              )}
            </StyledDropdownMenu>
          </Dropdown>
        </components.Control>
      );
    },
);
