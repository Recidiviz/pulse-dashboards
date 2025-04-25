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

import { palette, Sans14, typography } from "@recidiviz/design-system";
import { differenceInDays, isAfter, parseISO, startOfToday } from "date-fns";
import { isEqual, xor } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components/macro";

import Checkbox from "../../components/Checkbox/Checkbox";
import Slider from "../../components/Slider";
import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { formatDateToISO } from "../../utils";
import { Opportunity } from "../../WorkflowsStore";
import { getSnoozeUntilDate } from "../../WorkflowsStore/utils";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";
import { OtherReasonInput } from "../sharedComponents";
import { reasonsIncludesOtherKey } from "../utils/workflowsUtils";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import {
  buildDenialReasonsListText,
  buildResurfaceText,
} from "../WorkflowsJusticeInvolvedPersonProfile/MarkedIneligibleReasons";
import {
  ActionButton,
  MenuItem,
  OtherReasonWrapper,
  SidePanelContents,
  SidePanelHeader,
} from "../WorkflowsMilestones/styles";
import { DenialConfirmationModals } from "./DenialConfirmationModals";

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

const OtherReasonLabel = styled.label`
  ${typography.Sans12}
  color: ${palette.slate85};
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  padding: 0.5rem 1.1rem 0;
  margin-bottom: 0;
`;

const OtherReasonLength = styled.span<{ otherReasonInvalid: boolean }>`
  color: ${(props) =>
    props.otherReasonInvalid ? palette.data.crimson1 : palette.slate85};
`;

const OtherReasonSection = styled(OtherReasonWrapper)`
  background: ${palette.marble3};
  border-radius: ${rem(4)};
  border: 2px solid transparent;
`;

const maxOtherReasonCharLength = 1600;
const minOtherReasonCharLength = 3;

export const OpportunityDenialView = observer(function OpportunityDenialView({
  opportunity,
  onSubmit = () => null,
}: {
  opportunity?: Opportunity;
  onSubmit?: () => void;
}): JSX.Element | null {
  const {
    tenantStore: { labels },
  } = useRootStore();

  const [reasons, setReasons] = useState<string[]>(
    opportunity?.denial?.reasons ?? [],
  );
  const [otherReason, setOtherReason] = useState<string>(
    opportunity?.denial?.otherReason ?? "",
  );

  const [snoozeForDays, setSnoozeForDays] = useState<number>(
    opportunity?.manualSnooze?.snoozeForDays ?? 0,
  );

  const [autoSnoozeUntil, setAutoSnoozeUntil] = useState<string | undefined>(
    opportunity?.autoSnooze?.snoozeUntil,
  );

  const { disableSnoozeSlider, submittedOpportunityStatus } =
    useFeatureVariants();

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  if (!opportunity) return null;

  const snoozeConfig = opportunity.config.snooze;

  const snoozeEnabled = snoozeConfig !== undefined;

  let releaseDate: Date | undefined;
  const { person } = opportunity;
  if ("expirationDate" in person && person.expirationDate instanceof Date) {
    releaseDate = person.expirationDate;
  } else if ("releaseDate" in person && person.releaseDate instanceof Date) {
    releaseDate = person.releaseDate;
  }

  const daysToRelease =
    releaseDate !== undefined && isAfter(releaseDate, startOfToday())
      ? differenceInDays(releaseDate, startOfToday())
      : Infinity;

  const maxManualSnoozeDays =
    snoozeConfig?.maxSnoozeDays !== undefined
      ? Math.min(daysToRelease, snoozeConfig?.maxSnoozeDays)
      : undefined;

  const defaultManualSnoozeDays =
    snoozeConfig?.defaultSnoozeDays !== undefined
      ? Math.min(daysToRelease, snoozeConfig?.defaultSnoozeDays)
      : undefined;

  const defaultAutoSnoozeFn = snoozeConfig?.autoSnoozeParams;

  const sliderDays = (snoozeForDays || defaultManualSnoozeDays) ?? 0;

  const { denialConfirmationModalName } = opportunity;

  const postDenialToast = () => {
    if (submittedOpportunityStatus) {
      toast(
        <OpportunityStatusUpdateToast
          toastText={`${opportunity.person.displayName} is now in the ${opportunity.tabTitle()} tab for ${opportunity.config.label}`}
        />,
        {
          id: "denialToast", // prevent duplicate toasts
          position: "bottom-left",
        },
      );
    }
  };

  const submitDenial = async () => {
    setShowConfirmationModal(false);

    if (reasons.length === 0) {
      await opportunity.deleteOpportunityDenialAndSnooze();
      postDenialToast();
      onSubmit();
      return;
    }

    await opportunity.setDenialReasons(reasons);
    await opportunity.setOtherReasonText(otherReason);
    if (snoozeEnabled) {
      if (maxManualSnoozeDays) {
        await opportunity.setManualSnooze(sliderDays, reasons);
      } else if (defaultAutoSnoozeFn) {
        await opportunity.setAutoSnooze(defaultAutoSnoozeFn, reasons);
      }
    }
    postDenialToast();
    onSubmit();
  };

  const handleAlternativeSubmission = async () => {
    // Called when the confirmation modal handled the submission itself
    setShowConfirmationModal(false);
    onSubmit();
  };

  const DenialConfirmationModal =
    denialConfirmationModalName &&
    DenialConfirmationModals[denialConfirmationModalName];

  const handleSave = () => {
    if (denialConfirmationModalName) {
      setShowConfirmationModal(true);
    } else {
      submitDenial();
    }
  };

  const handleSliderChange = async (value: number) => {
    setSnoozeForDays(value);
  };

  const disableSlider = reasons.length === 0;

  const unsetSlider = maxManualSnoozeDays && !sliderDays;
  const otherReasonInvalid =
    reasonsIncludesOtherKey(reasons) &&
    (otherReason ?? "").length < minOtherReasonCharLength;

  const otherReasonChanged =
    reasonsIncludesOtherKey(reasons) &&
    otherReason === opportunity.denial?.otherReason;

  const reasonsUnchanged =
    isEqual(new Set(reasons), new Set(opportunity.denial?.reasons)) &&
    !otherReasonChanged;

  const sliderUnchanged =
    sliderDays === opportunity?.manualSnooze?.snoozeForDays ||
    !maxManualSnoozeDays; // true if autoSnooze

  const disableSaveButton =
    (reasonsUnchanged && (sliderUnchanged || reasons.length === 0)) ||
    unsetSlider ||
    otherReasonInvalid;

  const snoozeUntilDate = autoSnoozeUntil
    ? parseISO(autoSnoozeUntil)
    : getSnoozeUntilDate({
        snoozeForDays: sliderDays,
        snoozedOn: formatDateToISO(startOfToday()),
      });

  const savingWillUnsnooze = reasons.length === 0 && !reasonsUnchanged;

  const prompt = opportunity.config.isAlert
    ? `Please select the reason(s) ${opportunity.person?.displayPreferredName} should be overridden:`
    : `Which of the following requirements has ${opportunity.person?.displayPreferredName} not met${opportunity.instanceDetails ? ` [${opportunity.instanceDetails}]` : ""}?`;

  const snoozeSection = (
    <>
      {maxManualSnoozeDays && !disableSnoozeSlider && (
        <SliderWrapper>
          <SliderLabel>Snooze for:</SliderLabel>
          <Slider
            data-testid="OpportunityDenialView__slider"
            disabled={disableSlider}
            max={maxManualSnoozeDays}
            value={sliderDays}
            onChange={handleSliderChange}
            tooltipLabelFormatter={(currentValue) =>
              currentValue === 1 ? "1 day" : `${currentValue} days`
            }
          />
        </SliderWrapper>
      )}
      {snoozeUntilDate !== undefined && (
        <SnoozeUntilReminderText>
          <div>{buildResurfaceText(opportunity, snoozeUntilDate, labels)}</div>
          <br />
          <div>{buildDenialReasonsListText(opportunity, reasons)}</div>
        </SnoozeUntilReminderText>
      )}
    </>
  );

  return (
    <SidePanelContents
      className="OpportunityDenial"
      data-testid="OpportunityDenial"
    >
      <Heading person={opportunity.person} trackingOpportunity={opportunity} />
      <SidePanelHeader>{prompt}</SidePanelHeader>
      <>
        {Object.entries(opportunity.config.denialReasons).map(
          ([code, description]) => (
            <MenuItem
              data-testid={`OpportunityDenialView__checkbox-${code}`}
              key={code}
              onClick={() => {
                const updatedReasons = xor(reasons, [code]).sort();
                setReasons(updatedReasons);

                if (snoozeEnabled) {
                  if (defaultAutoSnoozeFn && updatedReasons.length) {
                    setAutoSnoozeUntil(
                      formatDateToISO(
                        defaultAutoSnoozeFn(startOfToday(), opportunity),
                      ),
                    );
                  } else {
                    setAutoSnoozeUntil(undefined);
                  }
                }
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
          ),
        )}

        {reasonsIncludesOtherKey(reasons) && (
          <OtherReasonSection>
            <OtherReasonLabel htmlFor="OtherReasonInput">
              Enter at least 3 characters
              <span>
                <OtherReasonLength otherReasonInvalid={otherReasonInvalid}>
                  {(otherReason ?? "").length}
                </OtherReasonLength>{" "}
                / {maxOtherReasonCharLength}
              </span>
            </OtherReasonLabel>
            <OtherReasonInput
              data-testid="OtherReasonInput"
              id="OtherReasonInput"
              maxLength={maxOtherReasonCharLength}
              minLength={minOtherReasonCharLength}
              defaultValue={otherReason}
              placeholder="Please specify a reason…"
              onChange={(event) => setOtherReason(event.target.value)}
            />
          </OtherReasonSection>
        )}
      </>
      {snoozeEnabled && !savingWillUnsnooze && snoozeSection}
      <ActionButton
        data-testid="OpportunityDenialView__button"
        disabled={disableSaveButton}
        width="117px"
        onClick={handleSave}
      >
        Save
      </ActionButton>
      {DenialConfirmationModal ? (
        <DenialConfirmationModal
          opportunity={opportunity}
          reasons={reasons}
          otherReason={otherReason}
          snoozeUntilDate={snoozeUntilDate}
          showModal={showConfirmationModal}
          onCloseFn={() => setShowConfirmationModal(false)}
          onAlternativeSubmissionFn={handleAlternativeSubmission}
          onSuccessFn={submitDenial}
        />
      ) : null}
    </SidePanelContents>
  );
});
