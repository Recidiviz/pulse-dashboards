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

import { observer } from "mobx-react-lite";
import toast from "react-hot-toast";

import { Dropdown, DropdownMenu } from "~design-system";

import { Opportunity } from "../../WorkflowsStore";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";
import {
  OpportunityStatusDropdownMenuItem,
  StatusAwareToggle,
} from "./MenuButton.styles";

export const deleteSubmitted = async (opportunity: Opportunity) => {
  await opportunity.deleteSubmitted();
  // The person may become either Eligible or Almost Eligible
  toast(
    <OpportunityStatusUpdateToast
      toastText={`Marked ${opportunity.person.displayName} as ${opportunity.tabTitle()} for ${opportunity.config.label}`}
    />,
    {
      id: "eligibleToast", // prevent duplicate toasts
      position: "bottom-left",
    },
  );
};

const setSupervisorResponse = async (
  opportunity: Opportunity,
  type: "APPROVAL" | "DENIAL",
) => {
  await opportunity.setSupervisorResponse({ type });

  let toastText = `Marked ${opportunity.person.displayName} as ${opportunity.tabTitle()} for ${opportunity.config.label}`;

  // Submit snooze if it has been approved
  if (type === "APPROVAL" && opportunity.latestAction?.type === "DENIAL") {
    const {
      denialReasons: reasons,
      userInput,
      requestedSnoozeLength,
    } = opportunity.latestAction;

    await opportunity.setDenialReasons(reasons, userInput);

    if (requestedSnoozeLength) {
      await opportunity.setManualSnooze(requestedSnoozeLength, reasons);
    } else {
      // Indefinite snoozes use different toast copy.
      toastText = `You have approved ${opportunity.person.displayName} for an indefinite snooze.`;
    }
  }

  toast(<OpportunityStatusUpdateToast toastText={toastText} />, {
    id: "reviewToast", // prevent duplicate toasts
    position: "bottom-left",
  });
};

export const markSubmittedAndToast = async ({
  opportunity,
  subcategory,
  customToast,
}: {
  opportunity: Opportunity;
  subcategory?: string;
  customToast?: string;
}) => {
  const message = await opportunity.markSubmittedAndGenerateToast(
    subcategory,
    customToast,
  );

  if (message) {
    toast(<OpportunityStatusUpdateToast toastText={message} />, {
      id: "submittedToast", // prevent duplicate toasts
      position: "bottom-left",
      duration: 7000,
    });
  }
};

// TODO(#9558): Add menu items for opportunity grant review
const SupervisorSnoozeReviewItems = observer(
  function SupervisorSnoozeReviewItems({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    return (
      <>
        <OpportunityStatusDropdownMenuItem
          onClick={async () => {
            await setSupervisorResponse(opportunity, "APPROVAL");
          }}
        >
          {"Approve Snooze"}
        </OpportunityStatusDropdownMenuItem>
        <OpportunityStatusDropdownMenuItem
          onClick={async () => {
            await setSupervisorResponse(opportunity, "DENIAL");
          }}
        >
          {"Deny Snooze"}
        </OpportunityStatusDropdownMenuItem>
      </>
    );
  },
);

const DenialItem = observer(function DenialItem({
  opportunity,
  onDenialButtonClick = () => null,
}: {
  opportunity: Opportunity;
  onDenialButtonClick?: () => void;
}) {
  const { config } = opportunity;
  const denialText = opportunity.denial
    ? `Update ${config.denialNoun}`
    : config.denialButtonText ?? `Mark ${config.denialAdjective}`;
  return (
    <OpportunityStatusDropdownMenuItem onClick={onDenialButtonClick}>
      {denialText}
    </OpportunityStatusDropdownMenuItem>
  );
});

/**
 * If there are no subcategories, show a button to undo or mark submitted
 * depending on the opportunity's current status
 */
const SubmittedNonSubcategoryItems = observer(
  function SubmittedNonSubcategoryItems({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const submittedText = opportunity.submittedButtonText;
    const undoSubmitText = opportunity.undoSubmittedButtonText;
    if (opportunity.isSubmitted)
      return (
        <OpportunityStatusDropdownMenuItem
          onClick={async () => {
            await deleteSubmitted(opportunity);
          }}
        >
          {undoSubmitText}
        </OpportunityStatusDropdownMenuItem>
      );
    return (
      <OpportunityStatusDropdownMenuItem
        onClick={async () => {
          await markSubmittedAndToast({ opportunity: opportunity });
        }}
      >
        {submittedText}
      </OpportunityStatusDropdownMenuItem>
    );
  },
);

/**
 * If there are subcategories for submitted, show a menu option for each
 * submitted category
 */
const SubmittedSubcategoryItems = observer(
  function SubmittedSubcategoryMenuItems({
    opportunity,
    submittedSubcategories,
  }: {
    opportunity: Opportunity;
    submittedSubcategories: string[];
  }) {
    return (
      <>
        {submittedSubcategories.map((subcategory) => (
          <OpportunityStatusDropdownMenuItem
            key={subcategory}
            onClick={async () => {
              await markSubmittedAndToast({
                opportunity: opportunity,
                subcategory: subcategory,
              });
            }}
          >
            {opportunity.subcategoryHeadingFor(subcategory)}
          </OpportunityStatusDropdownMenuItem>
        ))}
      </>
    );
  },
);

const SubmittedItems = observer(function SubmittedItems({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const { submittedSubcategories } = opportunity;

  return submittedSubcategories && submittedSubcategories.length > 0 ? (
    <SubmittedSubcategoryItems
      opportunity={opportunity}
      submittedSubcategories={submittedSubcategories}
    />
  ) : (
    <SubmittedNonSubcategoryItems opportunity={opportunity} />
  );
});

/**
 * This component captures the logic of which menu items to render based on the
 * opportunity's configuration and status. Selecting a menu item allow us to move the
 * opportunity from its current status to a new status (e.g. denied, submitted, etc...)
 */
const MenuItems = observer(function MenuItems({
  opportunity,
  onDenialButtonClick = () => null,
}: {
  opportunity: Opportunity;
  onDenialButtonClick?: () => void;
}) {
  if (opportunity.isInSnoozeReview)
    return <SupervisorSnoozeReviewItems opportunity={opportunity} />;

  return (
    <>
      {<SubmittedItems opportunity={opportunity} />}
      {opportunity.config.supportsDenial && (
        <DenialItem
          opportunity={opportunity}
          onDenialButtonClick={onDenialButtonClick}
        />
      )}
    </>
  );
});

/**
 * The menu button shown when the opportunity is configured for submissions, i.e. when
 * supportsSubmitted is true on the opp config, which allows us to change the status
 * of the given opportunity (e.g. to submit, deny, request supervisor approval, etc...).
 */
export const SubmissionMenuButton = observer(function SubmissionMenuButton({
  opportunity,
  onDenialButtonClick,
}: {
  opportunity: Opportunity;
  onDenialButtonClick: () => void;
}) {
  const { config } = opportunity;

  const toggleText = config.isAlert ? "Override?" : "Update status";

  return (
    <Dropdown>
      <StatusAwareToggle>{toggleText}</StatusAwareToggle>
      <DropdownMenu>
        <MenuItems
          opportunity={opportunity}
          onDenialButtonClick={onDenialButtonClick}
        />
      </DropdownMenu>
    </Dropdown>
  );
});
