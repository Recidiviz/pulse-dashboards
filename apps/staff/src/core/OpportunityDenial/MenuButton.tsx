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

import { Dropdown, DropdownMenu } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import toast from "react-hot-toast";

import { Opportunity } from "../../WorkflowsStore";
import { UsIaEarlyDischargeOpportunity } from "../../WorkflowsStore/Opportunity/UsIa";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";
import {
  OpportunityStatusDropdownMenuItem,
  StatusAwareButton,
  StatusAwareToggle,
} from "./MenuButton.styles";
import UsIaMenuButton from "./UsIa/UsIaMenuButton";

export const MenuButton = observer(function MenuButton({
  opportunity,
  onDenialButtonClick = () => null,
}: {
  opportunity: Opportunity;
  onDenialButtonClick?: () => void;
}) {
  const { config } = opportunity;

  // If we don't support submission or denial, show no button
  if (!config.supportsSubmitted && !config.supportsDenial) {
    return null;
  }

  const toggleText = config.isAlert ? "Override?" : "Update status";

  const submittedText = `Mark ${opportunity.submittedTabTitle}`;
  const undoSubmitText = `Revert from ${opportunity.submittedTabTitle}`;

  const denialText = opportunity.denial
    ? `Update ${config.denialNoun}`
    : config.denialButtonText ?? `Mark ${config.denialAdjective}`;

  const deleteSubmitted = async () => {
    await opportunity.deleteSubmitted();
    // The person may become either Eligible or Almost Eligible
    toast(
      <OpportunityStatusUpdateToast
        toastText={`Marked ${opportunity.person.displayName} as ${opportunity.tabTitle()} for ${config.label}`}
      />,
      {
        id: "eligibleToast", // prevent duplicate toasts
        position: "bottom-left",
      },
    );
  };

  const markSubmittedAndToast = async (subcategory?: string) => {
    opportunity.markSubmittedAndGenerateToast(subcategory).then((message) => {
      if (message) {
        toast(<OpportunityStatusUpdateToast toastText={message} />, {
          id: "submittedToast", // prevent duplicate toasts
          position: "bottom-left",
          duration: 7000,
        });
      }
    });
  };

  const { submittedSubcategories } = opportunity;

  /**
   * TODO(#8376): If/where possible, we should explore a clean way to unify the UsIaMenuButton and MenuButton components.
   */
  if (opportunity instanceof UsIaEarlyDischargeOpportunity) {
    return (
      <UsIaMenuButton
        opportunity={opportunity}
        markSubmittedAndToast={markSubmittedAndToast}
        deleteSubmitted={deleteSubmitted}
      />
    );
  }

  if (config.supportsSubmitted) {
    return (
      <Dropdown>
        <StatusAwareToggle>{toggleText}</StatusAwareToggle>
        <DropdownMenu>
          {
            // If there are subcategories for submitted, show a menu option for each submitted category
            // eslint-disable-next-line no-nested-ternary
            submittedSubcategories && submittedSubcategories.length > 0 ? (
              <>
                {submittedSubcategories.map((subcategory) => (
                  <OpportunityStatusDropdownMenuItem
                    key={subcategory}
                    onClick={async () => {
                      await markSubmittedAndToast(subcategory);
                    }}
                  >
                    {opportunity.subcategoryHeadingFor(subcategory)}
                  </OpportunityStatusDropdownMenuItem>
                ))}
              </>
            ) : // If there are no subcategories, show a button to undo or mark submitted
            // depending on the opportunity's current status
            opportunity.isSubmitted ? (
              <OpportunityStatusDropdownMenuItem onClick={deleteSubmitted}>
                {undoSubmitText}
              </OpportunityStatusDropdownMenuItem>
            ) : (
              <OpportunityStatusDropdownMenuItem
                onClick={async () => {
                  await markSubmittedAndToast();
                }}
              >
                {submittedText}
              </OpportunityStatusDropdownMenuItem>
            )
          }
          <>
            {config.supportsDenial && (
              <OpportunityStatusDropdownMenuItem onClick={onDenialButtonClick}>
                {denialText}
              </OpportunityStatusDropdownMenuItem>
            )}
          </>
        </DropdownMenu>
      </Dropdown>
    );
  } else {
    return (
      <>
        {config.supportsDenial && (
          <StatusAwareButton onClick={onDenialButtonClick}>
            {config.denialButtonText ??
              (config.isAlert ? "Override?" : "Update eligibility")}
          </StatusAwareButton>
        )}
      </>
    );
  }
});
