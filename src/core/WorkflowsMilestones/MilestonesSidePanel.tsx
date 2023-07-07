// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  palette,
  Sans12,
  Sans16,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React, { Dispatch, SetStateAction, useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useHydrateOpportunities from "../../hooks/useHydrateOpportunities";
import { Client } from "../../WorkflowsStore";
import {
  formatPhoneNumber,
  validatePhoneNumber,
} from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsClientProfile/Heading";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import { ClientMilestones } from "./MilestonesCaseloadView";
import PhoneNumberInput from "./PhoneNumberInput";
import TextMessageInput from "./TextMessageInput";

const SidePanelHeader = styled(Sans16)`
  color: ${palette.pine1};
  padding: 1rem 0;
`;

const Warning = styled(Sans12)`
  color: ${palette.slate85};
  margin: 0.75rem 0;
`;

const ReviewInfo = styled(Sans16)`
  color: ${palette.slate85};
  margin: 2rem 0;
`;

const ReviewMessage = styled(Sans16)`
  color: ${palette.slate85};
  border: 1px solid ${palette.slate20};
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 8px;
  white-space: pre-line;
`;

const PhoneNumber = styled.span`
  color: ${palette.pine1};
`;

const ButtonsContainer = styled.div`
  ${typography.Sans14}

  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-end;
  width: 100%;
`;

const ActionButton = styled(Button)`
  border-radius: 4px;
  color: ${palette.marble1};
  width: 100%;
  margin-bottom: 0.75rem;
`;

const AlreadyCongratulatedButton = styled(Button)`
  border-radius: 4px;
  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  color: ${palette.slate85};
  width: 100%;
  margin-bottom: 0.75rem;

  :hover,
  :focus {
    color: ${palette.marble1};
  }
`;

const OptOutText = styled.div``;

const OptOutLink = styled.span`
  text-decoration: underline;
  cursor: pointer;
`;

const SidePanelContents = styled.div`
  display: flex;
  flex-flow: column nowrap;
  height: 85vh;
`;

type MILESTONES_SIDE_PANEL_VIEW =
  | "COMPOSING"
  | "REVIEWING"
  | "DECLINING"
  | "CONGRATULATED_IN_PERSON"
  | "OPPORTUNITY_AVAILABLE"
  | "MESSAGE_SENT";

interface SidePanelContentProps {
  client: Client;
  setCurrentView: Dispatch<SetStateAction<MILESTONES_SIDE_PANEL_VIEW>>;
}

const ComposeMessageView = observer(function ComposeMessageView({
  client,
  setCurrentView,
}: SidePanelContentProps): JSX.Element {
  const [disableReviewButton, setDisableReviewButton] = useState(false);
  const handleUpdatePhoneNumber = async (updatedPhoneNumber: string) => {
    const invalidPhoneNumber = !validatePhoneNumber(updatedPhoneNumber);
    setDisableReviewButton(invalidPhoneNumber);
    await client.updateMilestonesPhoneNumber(
      updatedPhoneNumber,
      invalidPhoneNumber
    );
  };

  const handleUpdateTextMessage = async (additionalMessage: string) => {
    const deletePendingMessage = additionalMessage === "";
    await client.updateMilestonesTextMessage(
      additionalMessage,
      deletePendingMessage
    );
  };

  const handleOnReviewClick = async () => {
    await client.updateMilestonesTextMessage(client.milestonesPendingMessage);
    setCurrentView("REVIEWING");
  };

  return (
    <SidePanelContents>
      <Heading person={client} />
      <SidePanelHeader>Milestones</SidePanelHeader>
      <ClientMilestones client={client} showAll />
      <PhoneNumberInput
        clientPhoneNumber={client.milestonesPhoneNumber}
        onUpdatePhoneNumber={handleUpdatePhoneNumber}
      />
      <TextMessageInput
        client={client}
        onUpdateTextMessage={handleUpdateTextMessage}
      />
      <Warning>
        Do not send critical information tied to deadlines. We cannot guarantee
        delivery of this text message.
      </Warning>
      <ButtonsContainer>
        <ActionButton
          onClick={handleOnReviewClick}
          disabled={disableReviewButton}
        >
          Review
        </ActionButton>
        <AlreadyCongratulatedButton>
          I congratulated them in-person or another way
        </AlreadyCongratulatedButton>
        <OptOutText>
          Opt out of sending a congratulations text?{" "}
          <OptOutLink>Tell us why</OptOutLink>
        </OptOutText>
      </ButtonsContainer>
    </SidePanelContents>
  );
});

const ReviewMessageView = observer(function ReviewMessageView({
  client,
  setCurrentView,
}: SidePanelContentProps): JSX.Element {
  useHydrateOpportunities(client);

  const handleOnSend = async () => {
    await client.sendMilestonesMessage();
    if (client.hasVerifiedOpportunities) {
      setCurrentView("OPPORTUNITY_AVAILABLE");
    } else {
      setCurrentView("MESSAGE_SENT");
    }
  };

  const { milestonesPhoneNumber, milestonesFullTextMessage } = client;

  return (
    <SidePanelContents>
      <Heading person={client} />
      <ReviewInfo>
        Here&apos;s a preview of the full text message we&apos;ll send to{" "}
        {client.displayPreferredName} at{" "}
        {milestonesPhoneNumber && (
          <PhoneNumber>{formatPhoneNumber(milestonesPhoneNumber)}</PhoneNumber>
        )}
      </ReviewInfo>
      {milestonesFullTextMessage && (
        <ReviewMessage>{milestonesFullTextMessage}</ReviewMessage>
      )}
      <ButtonsContainer>
        <ActionButton onClick={handleOnSend}>Send congratulations</ActionButton>
      </ButtonsContainer>
    </SidePanelContents>
  );
});

const MilestonesSidePanelContent = observer(
  function MilestonesSidePanelContent(): JSX.Element {
    const {
      workflowsStore: { selectedClient },
    } = useRootStore();
    const [currentView, setCurrentView] =
      useState<MILESTONES_SIDE_PANEL_VIEW>("COMPOSING");

    if (!selectedClient) return <div />;

    switch (currentView) {
      case "COMPOSING":
        return (
          <ComposeMessageView
            client={selectedClient}
            setCurrentView={setCurrentView}
          />
        );
      case "REVIEWING":
        return (
          <ReviewMessageView
            client={selectedClient}
            setCurrentView={setCurrentView}
          />
        );
      case "OPPORTUNITY_AVAILABLE":
        return <div>Opportunity available view</div>;
      default:
        return <div>Default page</div>;
    }
  }
);

export const MilestonesSidePanel = observer(function TaskPreviewModal() {
  const {
    workflowsStore: { selectedClient },
  } = useRootStore();

  return (
    <WorkflowsPreviewModal
      isOpen={!!selectedClient}
      pageContent={<MilestonesSidePanelContent />}
    />
  );
});
