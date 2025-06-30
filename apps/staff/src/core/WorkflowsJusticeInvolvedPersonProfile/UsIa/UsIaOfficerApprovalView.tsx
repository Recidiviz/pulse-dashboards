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
  Button,
  spacing,
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { CharacterCountTextField } from "../../../components/CharacterCountTextField/CharacterCountTextField";
import Checkbox from "../../../components/Checkbox";
import { useRootStore } from "../../../components/StoreProvider";
import { UsIaEarlyDischargeOpportunity } from "../../../WorkflowsStore/Opportunity/UsIa";
import {
  DEFAULT_MAX_CHAR_LENGTH,
  DEFAULT_MIN_CHAR_LENGTH,
} from "../../constants";
import { OpportunityStatusUpdateToast } from "../../opportunityStatusUpdateToast";
import { OpportunityOverview } from "../OpportunityOverview";
import { OpportunitySidebarProfileProps } from "../types";

const ConfirmationOfDataInvestigationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};

  .Checkbox__container {
    width: unset;
    margin-bottom: unset;
  }
`;

const Header = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};

  span {
    color: ${palette.data.crimson1};
  }
`;

const SaveButton = styled(Button)`
  width: fit-content;
  padding: 14px ${rem(spacing.md)};
`;

export const UsIaOfficerApprovalView: React.FC<OpportunitySidebarProfileProps> =
  observer(function UsIaOfficerApprovalView({
    opportunity,
    shouldTrackOpportunityPreviewed = true,
    onSubmit,
  }) {
    const {
      workflowsStore: { justiceInvolvedPersonTitle },
    } = useRootStore();

    const [isConfirmed, setIsConfirmed] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState("");

    if (
      !opportunity?.person ||
      !(opportunity instanceof UsIaEarlyDischargeOpportunity)
    ) {
      return null;
    }

    const canSubmit =
      isConfirmed &&
      (additionalNotes.length === 0 ||
        additionalNotes.length >= DEFAULT_MIN_CHAR_LENGTH);

    const handleSubmit = async () => {
      if (canSubmit) {
        await opportunity.setOfficerAction({
          type: "APPROVAL",
          notes: additionalNotes ?? undefined,
        });

        toast(
          <OpportunityStatusUpdateToast
            toastText={`You have submitted ${opportunity.person.displayName} for Early Discharge. Sent to supervisor for additional approval.`}
          />,
          {
            id: "earlyDischargeApprovalToast",
            position: "bottom-left",
            duration: 7000,
          },
        );
      }
      onSubmit?.();
    };

    return (
      <article>
        <OpportunityOverview
          opportunity={opportunity}
          justiceInvolvedPersonTitle={justiceInvolvedPersonTitle}
          shouldTrackOpportunityPreviewed={shouldTrackOpportunityPreviewed}
          hideActionButtons
        />
        <ConfirmationOfDataInvestigationContainer>
          <Header>
            Confirmation of Data Investigation <span>*</span>
          </Header>

          <Checkbox
            name="confirm-requirements"
            value="confirmed"
            checked={isConfirmed}
            onChange={() => setIsConfirmed((prev) => !prev)}
          >
            I confirm that all requirements have been checked.
          </Checkbox>

          <CharacterCountTextField
            id="additional-notes"
            header="Additional Notes"
            label="Enter any additional information"
            value={additionalNotes}
            onChange={(newValue) => setAdditionalNotes(newValue)}
            minLength={DEFAULT_MIN_CHAR_LENGTH}
            maxLength={DEFAULT_MAX_CHAR_LENGTH}
            placeholder="Add notes for supervisor review..."
            isOptional={true}
          />
          <TooltipTrigger contents="To move to 'Supervisor Review'">
            <SaveButton
              shape="block"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Save
            </SaveButton>
          </TooltipTrigger>
        </ConfirmationOfDataInvestigationContainer>
      </article>
    );
  });
