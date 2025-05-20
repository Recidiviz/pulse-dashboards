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

import { useState } from "react";
import toast from "react-hot-toast";

import { CharacterCountTextField } from "../../../components/CharacterCountTextField";
import { UsIaEarlyDischargeOpportunity } from "../../../WorkflowsStore/Opportunity/UsIa";
import {
  DEFAULT_MAX_CHAR_LENGTH,
  DEFAULT_MIN_CHAR_LENGTH,
} from "../../constants";
import { OpportunityStatusUpdateToast } from "../../opportunityStatusUpdateToast";
import { ActionButton } from "../../sharedComponents";
import { reasonsIncludesKey } from "../../utils/workflowsUtils";
import { UsIaActionPlansAndNotes } from "../../WorkflowsJusticeInvolvedPersonProfile";

const PUBLIC_SAFETY_KEY = "PUBLIC SAFETY";

export const UsIaManageActionPlan = ({
  opportunity,
  reasons,
  sliderDays,
  disableSaveButton,
  postDenialToast,
  onSubmit,
  onSave,
  snoozeSlider,
}: {
  opportunity: UsIaEarlyDischargeOpportunity;
  reasons: string[];
  sliderDays: number;
  disableSaveButton: boolean;
  postDenialToast: () => void;
  onSubmit: () => void;
  onSave: () => void;
  snoozeSlider?: JSX.Element;
}) => {
  const [actionPlanText, setActionPlanText] = useState<string>("");

  const hasPublicSafetyDenialReason = reasonsIncludesKey(
    PUBLIC_SAFETY_KEY,
    reasons,
  );

  const actionPlanInvalid =
    hasPublicSafetyDenialReason &&
    actionPlanText.length < DEFAULT_MIN_CHAR_LENGTH;

  const disableSave = disableSaveButton || actionPlanInvalid;

  const isEditingActionPlan =
    opportunity.clientStatus === "ACTION_PLAN_REVIEW_REVISION";

  const actionPlanHeaderText = isEditingActionPlan
    ? "Edit Action Plan"
    : "Action Plan";

  const actionPlanTextFieldPlaceholder = isEditingActionPlan
    ? "Please enter a revised action plan. This will be reviewed by a supervisor…"
    : "Please specify why this client is not eligible for early discharge. This will be reviewed by a supervisor…";

  const submitUsIaEarlyDischargeActionPlan = async (
    opportunity: UsIaEarlyDischargeOpportunity,
  ) => {
    // If client is being moved into Action Plan Review, we should
    // delete denials and submissions, if applicable.
    if (opportunity.denied) {
      await opportunity.deleteOpportunityDenialAndSnooze();
    }
    if (opportunity.isSubmitted) {
      await opportunity.deleteSubmitted();
    }
    await opportunity.setOfficerAction({
      type: "DENIAL",
      actionPlan: actionPlanText,
      denialReasons: reasons,
      requestedSnoozeLength: sliderDays,
    });

    toast(
      <OpportunityStatusUpdateToast
        toastText={`Action Plan has been submitted. ${opportunity.person.displayName} will now be sent to supervisor for review.`}
      />,
      {
        id: "actionPlanSubmittedToast", // prevent duplicate toasts
        position: "bottom-left",
      },
    );

    onSubmit();
  };

  const handleSave = async () => {
    if (hasPublicSafetyDenialReason) {
      submitUsIaEarlyDischargeActionPlan(opportunity);
    } else {
      onSave();
    }
  };

  return (
    <>
      {isEditingActionPlan && (
        <UsIaActionPlansAndNotes opportunity={opportunity} />
      )}
      {hasPublicSafetyDenialReason && (
        <CharacterCountTextField
          data-testid="ActionPlanInput"
          id="ActionPlanInput"
          maxLength={DEFAULT_MAX_CHAR_LENGTH}
          minLength={DEFAULT_MIN_CHAR_LENGTH}
          value={actionPlanText}
          placeholder={actionPlanTextFieldPlaceholder}
          onChange={(newValue) => setActionPlanText(newValue)}
          header={actionPlanHeaderText}
        />
      )}
      {snoozeSlider}
      <ActionButton disabled={disableSave} width="117px" onClick={handleSave}>
        Save
      </ActionButton>
    </>
  );
};
