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

import { DropdownMenuItem } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import Checkbox from "../../components/Checkbox";
import { Opportunity } from "../../WorkflowsStore";
import { DropdownItem } from "./DropdownItem";

const SelectReasonText = styled.div`
  color: ${palette.slate70};
  padding: 0.5rem 1rem;
`;

export const EligibleMenuOption = observer(function EligibleMenuOption({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const reasons = opportunity.denial?.reasons;

  return (
    <>
      <DropdownMenuItem
        onClick={() => {
          if (reasons?.length) {
            opportunity.setDenialReasons([]);
          }
        }}
        preventCloseOnClickEvent
      >
        <DropdownItem>
          <Checkbox
            value="eligible"
            checked={!reasons?.length}
            name="eligible"
            disabled
          >
            Eligible
          </Checkbox>
        </DropdownItem>
      </DropdownMenuItem>
      <SelectReasonText>Not eligible? Select reason(s):</SelectReasonText>
    </>
  );
});
