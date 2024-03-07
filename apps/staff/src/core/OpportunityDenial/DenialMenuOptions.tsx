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

import { DropdownMenuItem } from "@recidiviz/design-system";
import { debounce, xor } from "lodash";
import { observer } from "mobx-react-lite";

import Checkbox from "../../components/Checkbox/Checkbox";
import { Opportunity } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";
import { OtherReasonInput, OtherReasonInputWrapper } from "../sharedComponents";
import { DropdownItem } from "./DropdownItem";

export const DenialMenuOptions = observer(function DenialMenuOptions({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const reasons = opportunity.denial?.reasons;
  return (
    <>
      {Object.entries(opportunity?.config.denialReasons).map(([code, desc]) => (
        <DropdownMenuItem
          key={code}
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
        <OtherReasonInputWrapper>
          <OtherReasonInput
            defaultValue={opportunity.denial?.otherReason}
            placeholder="Please specify a reason…"
            onChange={debounce(
              (event) => opportunity.setOtherReasonText(event.target.value),
              500,
            )}
          />
        </OtherReasonInputWrapper>
      )}
    </>
  );
});
