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
  TooltipTrigger,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import toast from "react-hot-toast";

import { useRootStore } from "../../../components/StoreProvider";
import { UsIaEarlyDischargeOpportunity } from "../../../WorkflowsStore/Opportunity/UsIa";
import { OpportunityStatusUpdateToast } from "../../opportunityStatusUpdateToast";
import { useOpportunitySidePanel } from "../../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";
import {
  OpportunityStatusDropdownMenuItem,
  StatusAwareToggle,
} from "../MenuButton.styles";
import { MenuConfig } from "./types";

const UsIaMenuButton = observer(function MenuButton({
  opportunity,
  markSubmittedAndToast,
  deleteSubmitted,
}: {
  opportunity: UsIaEarlyDischargeOpportunity;
  markSubmittedAndToast: (subcategory?: string) => Promise<void>;
  deleteSubmitted: () => Promise<void>;
}) {
  const { workflowsStore } = useRootStore();
  const { setCurrentView } = useOpportunitySidePanel();
  const { latestAction, clientStatus } = opportunity;

  const supervisorApprovalAndToast = async () => {
    await opportunity.setSupervisorResponse({ type: "APPROVAL" });

    if (latestAction?.type === "DENIAL") {
      const reasons = latestAction.denialReasons;

      await opportunity.setDenialReasons(reasons);
      await opportunity.setManualSnooze(
        latestAction.requestedSnoozeLength,
        reasons,
      );

      toast(
        <OpportunityStatusUpdateToast
          toastText={`Action Plan has been approved. ${opportunity.person.displayName} will now be snoozed for ${latestAction.requestedSnoozeLength} days before reappearing.`}
        />,
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

  // TODO(#8669): Add tooltip copy to menu options
  const menuConfig: MenuConfig = {
    ELIGIBLE_NOW: {
      options: [
        {
          label: "Submit for Supervisor Approval",
          onClick: () => setCurrentView("US_IA_MARK_ELIGIBLE_FOR_APPROVAL"),
        },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
        },
      ],
    },
    ACTION_PLAN_REVIEW: {
      buttonLabel: "Review",
      options: [
        {
          label: "Request Revisions",
          onClick: () => setCurrentView("US_IA_REQUEST_REVISIONS"),
        },
        {
          label: "Approve Snooze",
          onClick: () => supervisorApprovalAndToast(),
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
    DISCHARGE_FORM_REVIEW: {
      buttonLabel: "Review",
      options: [
        {
          label: "Approve Discharge and Forms",
          onClick: () => supervisorApprovalAndToast(),
        },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
        },
      ],
    },
    READY_FOR_DISCHARGE: {
      options: [
        { label: "Mark Submitted", onClick: () => markSubmittedAndToast() },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
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
        },
      ],
    },
    SUBMITTED: {
      options: [
        {
          label: "Revert from Submitted",
          onClick: () => deleteSubmitted(),
        },
        {
          label: "Mark as Ineligible",
          onClick: () => setCurrentView("MARK_INELIGIBLE"),
        },
      ],
    },
  };

  const { buttonLabel = "Update Eligibility", options } =
    menuConfig[clientStatus];

  return (
    <Dropdown>
      <StatusAwareToggle>{buttonLabel}</StatusAwareToggle>
      <DropdownMenu>
        {options.map((option) => {
          const contents = (
            <OpportunityStatusDropdownMenuItem
              key={option.label}
              onClick={() => {
                option.onClick();
                workflowsStore.updateSelectedOpportunityOnFullProfile(
                  opportunity,
                );
              }}
            >
              {option.label}
            </OpportunityStatusDropdownMenuItem>
          );
          return option.tooltip ? (
            <TooltipTrigger contents={option.tooltip}>
              {contents}
            </TooltipTrigger>
          ) : (
            contents
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
});

export default UsIaMenuButton;
