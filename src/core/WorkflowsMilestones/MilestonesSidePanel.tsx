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

import { observer } from "mobx-react-lite";
import React, { Dispatch, SetStateAction, useState } from "react";

import { useRootStore } from "../../components/StoreProvider";
import useHydrateOpportunities from "../../hooks/useHydrateOpportunities";
import { Client } from "../../WorkflowsStore";
import {
  formatPhoneNumber,
  validatePhoneNumber,
} from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsClientProfile/Heading";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import { ClientMilestones, MilestonesTab } from "./MilestonesCaseloadView";
import PhoneNumberInput from "./PhoneNumberInput";
import {
  ActionButton,
  AlreadyCongratulatedButton,
  ButtonsContainer,
  OptOutLink,
  OptOutText,
  PhoneNumber,
  ReviewInfo,
  ReviewMessage,
  SidePanelContents,
  SidePanelHeader,
  Warning,
} from "./styles";
import TextMessageInput from "./TextMessageInput";

export type MILESTONES_SIDE_PANEL_VIEW =
  | "COMPOSING"
  | "REVIEWING"
  | "DECLINING"
  | "CONGRATULATED_ANOTHER_WAY"
  | "OPPORTUNITY_AVAILABLE"
  | "MESSAGE_SENT";

interface ComposeMessageViewProps {
  client: Client;
  closeModal: () => void;
}

interface ReviewMessageViewProps {
  client: Client;
  setCurrentView: Dispatch<SetStateAction<MILESTONES_SIDE_PANEL_VIEW>>;
}

const ComposeMessageView = function ComposeMessageView({
  client,
  closeModal,
}: ComposeMessageViewProps): JSX.Element {
  const [disableReviewButton, setDisableReviewButton] = useState(false);
  const [currentView, setCurrentView] =
    useState<MILESTONES_SIDE_PANEL_VIEW>("COMPOSING");

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

  switch (currentView) {
    case "COMPOSING":
      return (
        <SidePanelContents>
          <Heading person={client} />
          <SidePanelHeader>Milestones</SidePanelHeader>
          <ClientMilestones client={client} showAll />
          <PhoneNumberInput
            client={client}
            onUpdatePhoneNumber={handleUpdatePhoneNumber}
          />
          <TextMessageInput
            client={client}
            onUpdateTextMessage={handleUpdateTextMessage}
          />
          <Warning>
            Do not send critical information tied to deadlines. We cannot
            guarantee delivery of this text message.
          </Warning>
          <ButtonsContainer>
            <ActionButton
              onClick={handleOnReviewClick}
              disabled={disableReviewButton}
            >
              Review
            </ActionButton>
            <AlreadyCongratulatedButton
              onClick={() => setCurrentView("CONGRATULATED_ANOTHER_WAY")}
            >
              I congratulated them in-person or another way
            </AlreadyCongratulatedButton>
            <OptOutText>
              Opt out of sending a congratulations text?{" "}
              <OptOutLink onClick={() => setCurrentView("DECLINING")}>
                Tell us why
              </OptOutLink>
            </OptOutText>
          </ButtonsContainer>
        </SidePanelContents>
      );
    case "REVIEWING":
      return (
        <ReviewMessageView client={client} setCurrentView={setCurrentView} />
      );
    case "CONGRATULATED_ANOTHER_WAY":
      return <div>TODO CONGRATULATED_ANOTHER_WAY</div>;
    case "DECLINING":
      return <div>TODO Declining</div>;
    case "OPPORTUNITY_AVAILABLE":
      return <div>TODO Opportunity Available</div>;
    case "MESSAGE_SENT":
      return <div>TODO Message Sent</div>;
    default:
      return <div>Default page</div>;
  }
};

const ReviewMessageView = observer(function ReviewMessageView({
  client,
  setCurrentView,
}: ReviewMessageViewProps): JSX.Element {
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
  function MilestonesSidePanelContent({
    activeTab,
    closeModal,
  }: {
    activeTab: MilestonesTab;
    closeModal: () => void;
  }): JSX.Element {
    const {
      workflowsStore: { selectedClient },
    } = useRootStore();

    if (!selectedClient) return <div />;

    switch (activeTab) {
      case "NEW_MILESTONES":
        return (
          <ComposeMessageView client={selectedClient} closeModal={closeModal} />
        );
      case "CONGRATULATED":
        return <div>TODO CONGRATULATED</div>;
      case "DECLINED":
        return <div>TODO DECLINED</div>;
      case "ERRORS":
        return <div>TODO ERRORS</div>;
      default:
        return <div>Default page</div>;
    }
  }
);

export const MilestonesSidePanel = observer(function MilestonesSidePanel({
  activeTab,
}: {
  activeTab: MilestonesTab;
}) {
  const {
    workflowsStore,
    workflowsStore: { selectedClient },
  } = useRootStore();

  return (
    <WorkflowsPreviewModal
      isOpen={!!selectedClient}
      pageContent={
        <MilestonesSidePanelContent
          activeTab={activeTab}
          closeModal={() => workflowsStore.updateSelectedPerson(undefined)}
        />
      }
    />
  );
});
