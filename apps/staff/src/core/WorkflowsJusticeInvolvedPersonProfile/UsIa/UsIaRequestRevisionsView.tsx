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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components/macro";

import { CharacterCountTextField } from "../../../components/CharacterCountTextField";
import Checkbox from "../../../components/Checkbox";
import {
  ActionButton,
  MenuItem,
  SidePanelContents,
  SidePanelHeader,
} from "../../../core/sharedComponents";
import { Opportunity } from "../../../WorkflowsStore";
import { UsIaEarlyDischargeOpportunity } from "../../../WorkflowsStore/Opportunity/UsIa";
import {
  DEFAULT_MAX_CHAR_LENGTH,
  DEFAULT_MIN_CHAR_LENGTH,
} from "../../constants";
import { OpportunityStatusUpdateToast } from "../../opportunityStatusUpdateToast";
import { Heading } from "../Heading";
import { UsIaActionPlansAndNotes } from "../OpportunityDetailSidebarComponents";

const TextFieldContainer = styled.div`
  margin-bottom: ${rem(spacing.md)};
`;

export const UsIaRequestRevisionsView = observer(
  function UsIaRequestRevisionsView({
    opportunity,
    resetPreviewView,
  }: {
    opportunity?: Opportunity;
    resetPreviewView: () => void;
  }): JSX.Element | null {
    const [revisionRequest, setRevisionRequest] = useState("");

    if (!(opportunity instanceof UsIaEarlyDischargeOpportunity)) return null;

    const reasons =
      (opportunity.latestAction?.type === "DENIAL" &&
        opportunity.latestAction.denialReasons) ||
      [];

    const prompt = `Which of the following requirements has ${opportunity.person?.displayPreferredName} not met?`;

    const handleSave = async () => {
      await opportunity.setSupervisorResponse({
        type: "DENIAL",
        revisionRequest,
      });

      toast(
        <OpportunityStatusUpdateToast
          toastText={`You have requested revisions from ${opportunity.person.assignedStaffFullName} on ${opportunity.person.displayName}'s Action Plan`}
        />,
        {
          id: "requestRevisionsToast",
          position: "bottom-left",
        },
      );

      resetPreviewView();
    };

    return (
      <SidePanelContents className="OpportunityDenial">
        <Heading
          person={opportunity.person}
          trackingOpportunity={opportunity}
        />
        <SidePanelHeader>{prompt}</SidePanelHeader>

        {Object.entries(opportunity.config.denialReasons).map(
          ([code, description]) => (
            <MenuItem key={code}>
              <Checkbox
                value={code}
                checked={reasons.includes(code)}
                name="denial reason"
                disabled
              >
                {description}
              </Checkbox>
            </MenuItem>
          ),
        )}

        <UsIaActionPlansAndNotes opportunity={opportunity} />

        <TextFieldContainer>
          <CharacterCountTextField
            data-testid="RevisionsRequestInput"
            header="Revisions"
            id="RevisionsRequestInput"
            maxLength={DEFAULT_MAX_CHAR_LENGTH}
            minLength={DEFAULT_MIN_CHAR_LENGTH}
            value={revisionRequest}
            placeholder="Please specify the revisions needed for the officer's action plan..."
            onChange={(newValue) => setRevisionRequest(newValue)}
          />
        </TextFieldContainer>

        <ActionButton
          disabled={revisionRequest.length < DEFAULT_MIN_CHAR_LENGTH}
          width="117px"
          onClick={handleSave}
        >
          Submit
        </ActionButton>
      </SidePanelContents>
    );
  },
);
