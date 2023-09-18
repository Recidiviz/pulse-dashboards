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

import { debounce, xor } from "lodash";
import { useState } from "react";

import Checkbox from "../../components/Checkbox/Checkbox";
import { Opportunity } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";
import { OtherReasonInput } from "../sharedComponents";
import { Heading } from "../WorkflowsClientProfile/Heading";
import {
  ActionButton,
  MenuItem,
  OtherReasonWrapper,
  SidePanelContents,
  SidePanelHeader,
} from "../WorkflowsMilestones/styles";

export function OpportunityDenialView({
  opportunity,
  onSubmit = () => null,
}: {
  opportunity?: Opportunity;
  onSubmit?: () => void;
}): JSX.Element | null {
  const [reasons, setReasons] = useState<string[]>(
    opportunity?.denial?.reasons ?? []
  );
  const [otherReason, setOtherReason] = useState<string | undefined>(
    opportunity?.denial?.otherReason ?? ""
  );

  if (!opportunity) return null;

  const handleSubmit = async () => {
    await opportunity.setDenialReasons(reasons);
    onSubmit();
  };

  return (
    <SidePanelContents
      className="OpportunityDenial"
      data-testid="OpportunityDenial"
    >
      <Heading person={opportunity.person} />
      <SidePanelHeader>
        Which of the following requirements has{" "}
        {opportunity.person?.displayPreferredName} not met?
      </SidePanelHeader>
      <>
        {Object.entries(opportunity.denialReasonsMap).map(
          ([code, description]) => (
            <MenuItem
              key={code}
              onClick={() => {
                setReasons(xor(reasons, [code]).sort());
              }}
            >
              <Checkbox
                value={code}
                checked={reasons.includes(code) || false}
                name="denial reason"
                disabled
              >
                {description}
              </Checkbox>
            </MenuItem>
          )
        )}

        {reasons.includes(OTHER_KEY) && (
          <OtherReasonWrapper>
            <OtherReasonInput
              defaultValue={otherReason}
              placeholder="Please specify a reason…"
              onChange={(event) => {
                debounce(() => setOtherReason(event.target.value), 500);
              }}
            />
          </OtherReasonWrapper>
        )}
      </>
      <ActionButton width="117px" onClick={handleSubmit}>
        Confirm
      </ActionButton>
    </SidePanelContents>
  );
}
