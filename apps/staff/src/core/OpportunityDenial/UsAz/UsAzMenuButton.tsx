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

import { UsAzTransferToAdministrativeSupervisionOpportunity } from "../../../WorkflowsStore/Opportunity/UsAz/UsAzTransferToAdministrativeSupervisionOpportunity/UsAzTransferToAdministrativeSupervisionOpportunity";
import { StatusAwareButton } from "../MenuButton.styles";
import {
  deleteSubmitted,
  markSubmittedAndToast,
} from "../SubmissionMenuButton";

export const UsAzMarkSubmittedButton = observer(
  function UsAzMarkSubmittedButton({
    opportunity,
  }: {
    opportunity: UsAzTransferToAdministrativeSupervisionOpportunity;
  }) {
    const submittedText = opportunity.submittedTabTitle;
    const undoSubmitText = `Revert from Transferred`;

    // Show a button to undo or mark submitted depending on the opportunity's current status
    if (opportunity.isSubmitted) {
      return (
        <StatusAwareButton
          onClick={(e) => {
            e.stopPropagation();
            deleteSubmitted(opportunity);
          }}
          kind={"secondary"}
        >
          {undoSubmitText}
        </StatusAwareButton>
      );
    }

    const customToast = `Marked as ${opportunity.submittedTabTitle}`;
    return (
      <StatusAwareButton
        onClick={(e) => {
          e.stopPropagation();
          markSubmittedAndToast({
            opportunity: opportunity,
            subcategory: undefined,
            customToast: customToast,
          });
        }}
        kind={"primary"}
      >
        {submittedText}
      </StatusAwareButton>
    );
  },
);

const UsAzMenuButton = observer(function UsAzMenuButton({
  opportunity,
  onDenialButtonClick = () => null,
}: {
  opportunity: UsAzTransferToAdministrativeSupervisionOpportunity;
  onDenialButtonClick?: () => void;
}) {
  const denialText = opportunity.denial
    ? `Update ${opportunity.config.denialNoun}`
    : opportunity.config.denialButtonText ??
      `Mark ${opportunity.config.denialAdjective}`;

  return (
    <>
      {opportunity.config.supportsSubmitted && (
        <UsAzMarkSubmittedButton opportunity={opportunity} />
      )}
      {opportunity.config.supportsDenial && (
        <StatusAwareButton onClick={onDenialButtonClick} kind={"secondary"}>
          {denialText}
        </StatusAwareButton>
      )}
    </>
  );
});

export default UsAzMenuButton;
