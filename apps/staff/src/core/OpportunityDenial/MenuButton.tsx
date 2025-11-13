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

import { observer } from "mobx-react-lite";

import { Opportunity } from "../../WorkflowsStore";
import { UsAzTransferToAdministrativeSupervisionOpportunity } from "../../WorkflowsStore/Opportunity/UsAz/UsAzTransferToAdministrativeSupervisionOpportunity/UsAzTransferToAdministrativeSupervisionOpportunity";
import {
  UsIaEarlyDischargeOpportunity,
  UsIaSupervisionLevelDowngradeOpportunity,
} from "../../WorkflowsStore/Opportunity/UsIa";
import { StatusAwareButton } from "./MenuButton.styles";
import {
  deleteSubmitted,
  markSubmittedAndToast,
  SubmissionMenuButton,
} from "./SubmissionMenuButton";
import UsAzMenuButton from "./UsAz/UsAzMenuButton";
import UsIaMenuButton from "./UsIa/UsIaMenuButton";

// TODO(#9771): Consider adding a presenter to this component to determine which menu
// items are relevant.
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

  /**
   * TODO(#8376): If/where possible, we should explore a clean way to unify the UsIaMenuButton and MenuButton components.
   */
  if (
    opportunity instanceof UsIaEarlyDischargeOpportunity ||
    opportunity instanceof UsIaSupervisionLevelDowngradeOpportunity
  ) {
    return (
      <UsIaMenuButton
        opportunity={opportunity}
        markSubmittedAndToast={async () => {
          await markSubmittedAndToast({ opportunity: opportunity });
        }}
        deleteSubmitted={async () => {
          await deleteSubmitted(opportunity);
        }}
      />
    );
  }
  // Arizona Admin Supervision requires separate buttons rather than dropdowns
  if (
    opportunity instanceof UsAzTransferToAdministrativeSupervisionOpportunity
  ) {
    return (
      <UsAzMenuButton
        opportunity={opportunity}
        onDenialButtonClick={onDenialButtonClick}
      />
    );
  }

  if (config.supportsSubmitted) {
    return (
      <SubmissionMenuButton
        opportunity={opportunity}
        onDenialButtonClick={onDenialButtonClick}
      />
    );
  } else {
    return (
      <>
        {config.supportsDenial && (
          <StatusAwareButton onClick={onDenialButtonClick} kind={"secondary"}>
            {config.denialButtonText ??
              (config.isAlert ? "Override?" : "Update eligibility")}
          </StatusAwareButton>
        )}
      </>
    );
  }
});
