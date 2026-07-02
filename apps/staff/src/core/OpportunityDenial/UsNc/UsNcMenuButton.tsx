// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { observer } from "mobx-react-lite";
import React from "react";
import toast from "react-hot-toast";

import { Dropdown, DropdownMenu } from "~design-system";

import { useFeatureVariants } from "../../../components/StoreProvider";
import {
  ADJUDICATION_STATUSES,
  AdjudicationStatusValue,
} from "../../../FirestoreStore";
import { UsNcCreditReductionReviewOpportunity } from "../../../WorkflowsStore/Opportunity/UsNc/UsNcCreditReductionReviewOpportunity";
import { OpportunityStatusUpdateToast } from "../../opportunityStatusUpdateToast";
import {
  deleteSubmitted,
  markSubmittedAndToast,
  requestGrant,
  SupervisorGrantReviewItems,
} from "../DropdownMenuButton";
import {
  OpportunityStatusDropdownMenuItem,
  StatusAwareToggle,
} from "../MenuButton.styles";

const UsNcMenuButton = observer(function UsNcMenuButton({
  opportunity,
  onDenialButtonClick = () => null,
}: {
  opportunity: UsNcCreditReductionReviewOpportunity;
  onDenialButtonClick?: () => void;
}) {
  const featureVariants = useFeatureVariants();
  const { adjudicationStatus } = opportunity;

  // When the chief is reviewing a grant request, show supervisor actions.
  // Mirror the logic in DropdownMenuButton: only users with the reviewer FV
  // can approve/deny; others see only the denial item.
  if (opportunity.isInGrantReview) {
    const reviewerFV = opportunity.config.reviewerFeatureVariant;
    const userCanApproveGrants = !!reviewerFV && !!featureVariants[reviewerFV];
    return (
      <Dropdown>
        <StatusAwareToggle>Update status</StatusAwareToggle>
        <DropdownMenu>
          {userCanApproveGrants ? (
            <SupervisorGrantReviewItems
              opportunity={opportunity}
              onDenialButtonClick={onDenialButtonClick}
            />
          ) : (
            opportunity.config.supportsDenial && (
              <OpportunityStatusDropdownMenuItem onClick={onDenialButtonClick}>
                {opportunity.denial
                  ? `Update ${opportunity.config.denialNoun}`
                  : opportunity.config.denialButtonText ??
                    `Mark ${opportunity.config.denialAdjective}`}
              </OpportunityStatusDropdownMenuItem>
            )
          )}
        </DropdownMenu>
      </Dropdown>
    );
  }

  const setAdjudicationStatus = async (status: AdjudicationStatusValue) => {
    await opportunity.setAdjudicationStatus(status);
    toast(
      <OpportunityStatusUpdateToast
        toastText={`Marked ${opportunity.person.displayName} as ${status} for ${opportunity.config.label}`}
      />,
      { id: "adjudicationToast", position: "bottom-left" },
    );
  };

  const revertAdjudicationStatus = async () => {
    await opportunity.deleteAdjudicationStatus();
    toast(
      <OpportunityStatusUpdateToast
        toastText={`Reverted ${opportunity.person.displayName} from ${adjudicationStatus?.adjudicationStatus} for ${opportunity.config.label}`}
      />,
      { id: "adjudicationToast", position: "bottom-left" },
    );
  };

  // When the supervisor approval flow is on, eligible opportunities show
  // "Submit for Chief Review" instead of "Mark Submitted to Commission".
  // Once the chief approves (isGrantApproved) or the PPO has already
  // submitted to Commission (isSubmitted), the standard submitted flow resumes.
  const shouldShowGrantRequestItem =
    opportunity.config.supportsSupervisorReviewOnGrants &&
    !opportunity.isGrantApproved &&
    !opportunity.isSubmitted;

  let primaryAction: React.ReactNode;
  if (adjudicationStatus) {
    primaryAction = (
      <OpportunityStatusDropdownMenuItem
        onClick={async () => {
          await revertAdjudicationStatus();
        }}
      >
        {`Revert from ${adjudicationStatus.adjudicationStatus}`}
      </OpportunityStatusDropdownMenuItem>
    );
  } else if (shouldShowGrantRequestItem) {
    primaryAction = (
      <OpportunityStatusDropdownMenuItem
        onClick={async () => {
          await requestGrant(opportunity);
        }}
      >
        {opportunity.config.grantReviewDropdownLabel}
      </OpportunityStatusDropdownMenuItem>
    );
  } else if (opportunity.isSubmitted) {
    primaryAction = (
      <OpportunityStatusDropdownMenuItem
        onClick={async () => {
          await deleteSubmitted(opportunity);
        }}
      >
        {opportunity.undoSubmittedButtonText}
      </OpportunityStatusDropdownMenuItem>
    );
  } else {
    primaryAction = (
      <OpportunityStatusDropdownMenuItem
        onClick={async () => {
          await markSubmittedAndToast({ opportunity });
        }}
      >
        {opportunity.submittedButtonText}
      </OpportunityStatusDropdownMenuItem>
    );
  }

  return (
    <Dropdown>
      <StatusAwareToggle>Update status</StatusAwareToggle>
      <DropdownMenu>
        {primaryAction}
        {!adjudicationStatus &&
          opportunity.isSubmitted &&
          ADJUDICATION_STATUSES.map((status) => (
            <OpportunityStatusDropdownMenuItem
              key={status}
              onClick={async () => {
                await setAdjudicationStatus(status);
              }}
            >
              {`Mark ${status}`}
            </OpportunityStatusDropdownMenuItem>
          ))}
        {opportunity.config.supportsDenial && (
          <OpportunityStatusDropdownMenuItem onClick={onDenialButtonClick}>
            {opportunity.denial
              ? `Update ${opportunity.config.denialNoun}`
              : opportunity.config.denialButtonText ??
                `Mark ${opportunity.config.denialAdjective}`}
          </OpportunityStatusDropdownMenuItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
});

export default UsNcMenuButton;
