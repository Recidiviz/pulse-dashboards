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

import { DropdownMenuItem, palette, spacing } from "@recidiviz/design-system";
import { debounce, xor } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import Checkbox from "../../components/Checkbox/Checkbox";
import { Opportunity } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";
import { OPPORTUNITY_STATUS_COLORS } from "../utils/workflowsUtils";
import { DropdownItem } from "./DropdownItem";

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
    border-color: ${OPPORTUNITY_STATUS_COLORS.ineligible.border};
  }
`;
export const DenialMenuOptions = observer(
  ({ opportunity }: { opportunity: Opportunity }) => {
    const reasons = opportunity.denial?.reasons;
    return (
      <>
        {Object.entries(opportunity?.denialReasonsMap).map(([code, desc]) => (
          <DropdownMenuItem
            onClick={() => {
              opportunity.setDenialReasons(xor(reasons, [code]).sort());
            }}
            preventCloseOnClickEvent
          >
            <DropdownItem>
              <Checkbox
                value={code}
                checked={reasons?.includes(code) || false}
                name="denial reason"
                disabled
              >
                {desc}
              </Checkbox>
            </DropdownItem>
          </DropdownMenuItem>
        ))}

        {reasons?.includes(OTHER_KEY) && (
          <OtherInputWrapper>
            <OtherInput
              defaultValue={opportunity.denial?.otherReason}
              placeholder="Please specify a reason…"
              onChange={debounce(
                (event) => opportunity.setOtherReasonText(event.target.value),
                500
              )}
            />
          </OtherInputWrapper>
        )}
      </>
    );
  }
);
