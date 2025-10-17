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

import toast from "react-hot-toast";

import {
  UsIaEarlyDischargeOpportunity,
  UsIaSupervisionLevelDowngradeOpportunity,
} from "../../../WorkflowsStore/Opportunity/UsIa";
import { OPPORTUNITY_SIDE_PANEL_VIEW } from "../../OpportunityCaseloadView/types";
import { OpportunityStatusUpdateToast } from "../../opportunityStatusUpdateToast";
import { reasonsIncludesKey } from "../../utils/workflowsUtils";
import {
  EarlyDischargeMenuConfig,
  MenuLabelWithOptions,
  SupervisionLevelDowngradeMenuConfig,
} from "./types";

export const getSldButtonConfig = ({
  opportunity,
  setCurrentView,
  deleteSubmitted,
}: {
  opportunity: UsIaSupervisionLevelDowngradeOpportunity;
  setCurrentView: (view: OPPORTUNITY_SIDE_PANEL_VIEW) => void;
  deleteSubmitted: () => Promise<void>;
}): MenuLabelWithOptions => {
  const { clientStatus } = opportunity;

  const eligibleOptions = [
    {
      label: "Approve Downgrade",
      onClick: () => setCurrentView("US_IA_REVIEW_DOWNGRADE"),
      tooltip: "To confirm all requirements checked",
    },
    {
      label: "Deny Downgrade",
      onClick: () => setCurrentView("MARK_INELIGIBLE"),
      tooltip: "To select a denial reason",
    },
  ];
  const menuConfig: SupervisionLevelDowngradeMenuConfig = {
    ELIGIBLE_NOW: { options: eligibleOptions },
    PENDING_ELIGIBILITY: { options: eligibleOptions },
    DENIED: {
      options: [
        {
          label: "Change Snooze/Denial Reason",
          onClick: () => {
            setCurrentView("MARK_INELIGIBLE");
          },
          tooltip: "Update denial reason or snooze length",
        },
      ],
    },
    SUBMITTED: {
      options: [
        {
          label: "Revert from Downgraded",
          onClick: () => deleteSubmitted(),
          tooltip: "To move to 'Eligible Now'",
        },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
          tooltip: "To move to 'Snoozed'",
        },
      ],
    },
  };

  return menuConfig[clientStatus];
};

export const getEdButtonConfig = ({
  opportunity,
  setCurrentView,
  markSubmittedAndToast,
  deleteSubmitted,
}: {
  opportunity: UsIaEarlyDischargeOpportunity;
  setCurrentView: (view: OPPORTUNITY_SIDE_PANEL_VIEW) => void;
  markSubmittedAndToast: (subcategory?: string) => Promise<void>;
  deleteSubmitted: () => Promise<void>;
}): MenuLabelWithOptions => {
  const { latestAction, clientStatus } = opportunity;

  const supervisorApprovalAndToast = async () => {
    await opportunity.setSupervisorResponse({ type: "APPROVAL" });

    if (latestAction?.type === "DENIAL") {
      const reasons = latestAction.denialReasons;
      const userInput = latestAction.userInput;

      await opportunity.setDenialReasons(reasons, userInput);

      if (latestAction.requestedSnoozeLength) {
        await opportunity.setManualSnooze(
          latestAction.requestedSnoozeLength,
          reasons,
        );
      }

      const snoozeApprovalToastText = reasonsIncludesKey("PUBLIC SAFETY RISK")
        ? `Action Plan has been approved. ${opportunity.person.displayName} will now be snoozed for ${latestAction.requestedSnoozeLength} days before reappearing.`
        : `You have approved ${opportunity.person.displayName} for an indefinite snooze.`;

      toast(
        <OpportunityStatusUpdateToast toastText={snoozeApprovalToastText} />,
        {
          id: "snoozeApprovalToast",
          position: "bottom-left",
          duration: 7000,
        },
      );
      return;
    }

    toast(
      <OpportunityStatusUpdateToast
        toastText={`You have approved ${opportunity.person.displayName} for Early Discharge. The officer will now take the next steps for discharge.`}
      />,
      {
        id: "dischargeApprovalToast",
        position: "bottom-left",
        duration: 7000,
      },
    );
  };

  const supervisorIndefiniteSnoozeDenialAndToast = async () => {
    await opportunity.setSupervisorResponse({ type: "DENIAL" });
    // When an indefinite snooze is denied, the client should move back to
    // "Eligible Now", so we'll mark the action history stale.
    await opportunity.markActionHistoryStale();

    toast(
      <OpportunityStatusUpdateToast
        toastText={`Denied indefinite snooze request for ${opportunity.person.displayName}. ${opportunity.person.displayName} is now in the ${opportunity.tabTitle()} tab for ${opportunity.config.label}`}
      />,
      {
        id: "indefiniteSnoozeDenialToast",
        position: "bottom-left",
        duration: 7000,
      },
    );
  };

  // TODO(#8669): Add tooltip copy to menu options
  const menuConfig: EarlyDischargeMenuConfig = {
    ELIGIBLE_NOW: {
      options: [
        {
          label: "Submit for Supervisor Approval",
          onClick: () => setCurrentView("US_IA_MARK_ELIGIBLE_FOR_APPROVAL"),
          tooltip: "To confirm all requirements checked",
        },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
          tooltip: "To select a denial reason",
        },
      ],
    },
    ACTION_PLAN_REVIEW: {
      buttonLabel: "Review",
      options: [
        {
          label: "Request Revisions",
          onClick: () => setCurrentView("US_IA_REQUEST_REVISIONS"),
          tooltip: "To move to 'Revisions Requests'",
        },
        {
          label: "Approve Snooze",
          onClick: () => supervisorApprovalAndToast(),
          tooltip: "To move to 'Snoozed'",
        },
      ],
    },
    ACTION_PLAN_REVIEW_REVISION: {
      options: [
        {
          label: "Edit Action Plan",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
        },
        {
          label: "Mark as Eligible",
          onClick: () => setCurrentView("US_IA_MARK_ELIGIBLE_FOR_APPROVAL"),
        },
      ],
    },
    SNOOZE_REVIEW: {
      buttonLabel: "Review",
      options: [
        {
          label: "Deny Indefinite Snooze",
          onClick: () => supervisorIndefiniteSnoozeDenialAndToast(),
          tooltip: "To move to 'Eligible Now'",
        },
        {
          label: "Approve Snooze",
          onClick: () => supervisorApprovalAndToast(),
          tooltip: "To move to 'Snoozed'",
        },
      ],
    },
    DISCHARGE_FORM_REVIEW: {
      buttonLabel: "Review",
      options: [
        {
          label: "Approve Discharge and Forms",
          onClick: () => supervisorApprovalAndToast(),
          tooltip: "To move to 'Ready for Discharge'",
        },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
          tooltip: "To move to 'Snoozed'",
        },
      ],
    },
    READY_FOR_DISCHARGE: {
      options: [
        {
          label: "Mark Submitted",
          onClick: () => markSubmittedAndToast(),
          tooltip: "To move to 'Forms Submitted'",
        },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
          tooltip: "To move to 'Snoozed'",
        },
      ],
    },
    DENIED: {
      options: [
        {
          label: "Change Snooze/Denial Reason",
          onClick: () => {
            setCurrentView("MARK_INELIGIBLE");
          },
          tooltip: "Update denial reason or snooze length",
        },
      ],
    },
    SUBMITTED: {
      options: [
        {
          label: "Revert from Submitted",
          onClick: () => deleteSubmitted(),
          tooltip: "To move to 'Ready for Discharge'",
        },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
          tooltip: "To move to 'Snoozed'",
        },
      ],
    },
  };

  return menuConfig[clientStatus];
};
