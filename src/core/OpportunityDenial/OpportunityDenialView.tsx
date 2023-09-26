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

import { palette, Sans14, typography } from "@recidiviz/design-system";
import { format, startOfToday } from "date-fns";
import { debounce, xor } from "lodash";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import styled from "styled-components/macro";

import Checkbox from "../../components/Checkbox/Checkbox";
import Slider from "../../components/Slider";
import { formatDateToISO } from "../../utils";
import { Opportunity } from "../../WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import { getSnoozeUntilDate, OTHER_KEY } from "../../WorkflowsStore/utils";
import { OtherReasonInput } from "../sharedComponents";
import { Heading } from "../WorkflowsClientProfile/Heading";
import {
  ActionButton,
  MenuItem,
  OtherReasonWrapper,
  SidePanelContents,
  SidePanelHeader,
} from "../WorkflowsMilestones/styles";

const SliderWrapper = styled.div`
  width: 100%;
  margin: 1rem 0;
  display: flex;
  flex-flow: column nowrap;

  .Slider {
    padding: 0 0.75rem;
  }
`;

const SliderLabel = styled.div`
  ${typography.Sans18}
  color: ${palette.pine1};
  margin-bottom: 2rem;
`;

const SnoozeUntilReminderText = styled(Sans14)`
  margin: 1rem 0;
  color: ${palette.slate85};
`;

export const OpportunityDenialView = observer(function OpportunityDenialView({
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

  const [snoozeForDays, setSnoozeForDays] = useState<number>(
    opportunity?.snoozeForDays ?? 0
  );

  if (!opportunity) return null;

  const maxManualSnoozeDays =
    OPPORTUNITY_CONFIGS[opportunity.type].snooze?.maxSnoozeDays;

  const defaultAutoSnoozeFn =
    OPPORTUNITY_CONFIGS[opportunity.type].snooze?.defaultSnoozeUntilFn;

  const handleSubmit = async () => {
    await opportunity.setDenialReasons(reasons);
    if (maxManualSnoozeDays) {
      await opportunity.setSnoozeForDays(snoozeForDays, reasons);
    } else if (defaultAutoSnoozeFn) {
      await opportunity.setAutoSnoozeUntil(defaultAutoSnoozeFn, reasons);
    }
    onSubmit();
  };

  const handleSliderChange = async (value: number) => {
    setSnoozeForDays(value);
  };

  const disableSlider = reasons.length === 0;
  const disableSaveButton = maxManualSnoozeDays
    ? reasons.length > 0 && !snoozeForDays
    : false;
  const snoozeUntilDate = getSnoozeUntilDate({
    snoozeForDays,
    snoozedOn: formatDateToISO(startOfToday()),
  });

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
      {maxManualSnoozeDays && (
        <SliderWrapper>
          <SliderLabel>Snooze for:</SliderLabel>
          <Slider
            disabled={disableSlider}
            max={maxManualSnoozeDays}
            value={snoozeForDays}
            onChange={handleSliderChange}
            tooltipLabelFormatter={(currentValue) => `${currentValue} days`}
          />
          {snoozeUntilDate !== undefined && (
            <SnoozeUntilReminderText>
              You will be reminded about this opportunity on{" "}
              {format(snoozeUntilDate, "LLLL d, yyyy")}
            </SnoozeUntilReminderText>
          )}
        </SliderWrapper>
      )}
      <ActionButton
        disabled={disableSaveButton}
        width="117px"
        onClick={handleSubmit}
      >
        Save
      </ActionButton>
    </SidePanelContents>
  );
});
