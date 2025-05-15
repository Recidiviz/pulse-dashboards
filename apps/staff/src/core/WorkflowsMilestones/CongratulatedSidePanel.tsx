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

import GreenCheckmark from "../../assets/static/images/greenCheckmark.svg?react";
import { TextMessageStatuses } from "../../FirestoreStore";
import useHydrateOpportunities from "../../hooks/useHydrateOpportunities";
import { formatWorkflowsDate } from "../../utils/formatStrings";
import { Client } from "../../WorkflowsStore";
import {
  formatPhoneNumber,
  optionalFieldToDate,
} from "../../WorkflowsStore/utils";
import { SidePanelContents } from "../sharedComponents";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import Banner from "./Banner";
import OpportunityAvailableCTA from "./OpportunityAvailableCTA";
import {
  ButtonsContainer,
  PhoneNumber,
  ReviewInfo,
  ReviewMessage,
  TextLink,
} from "./styles";

interface CongratulatedSidePanelProps {
  client: Client;
  closeModal?: () => void;
}

const MessageSentView = function MessageSentView({
  client,
  closeModal,
}: CongratulatedSidePanelProps) {
  const {
    milestonesFullTextMessage,
    milestonesMessageUpdateLog,
    milestonesPhoneNumber,
  } = client;
  const messageSentBy =
    milestonesMessageUpdateLog?.by ?? client.rootStore.userStore.userFullName;
  const messageSentOn = formatWorkflowsDate(
    optionalFieldToDate(milestonesMessageUpdateLog?.date),
  );

  useHydrateOpportunities(client);
  const opportunity = client.opportunities.usCaSupervisionLevelDowngrade?.[0];

  return (
    <SidePanelContents data-testid="CongratulatedSidePanel">
      <Banner icon={GreenCheckmark} text="Message Sent" />
      <Heading person={client} />
      <ReviewInfo>
        {messageSentBy} sent the following text messages to{" "}
        {client.displayPreferredName} at{" "}
        {milestonesPhoneNumber && (
          <PhoneNumber>{formatPhoneNumber(milestonesPhoneNumber)}</PhoneNumber>
        )}{" "}
        {messageSentOn && `on ${messageSentOn}`}.
      </ReviewInfo>
      <ReviewMessage>{milestonesFullTextMessage}</ReviewMessage>
      <ReviewMessage>To stop receiving these texts, reply: STOP</ReviewMessage>
      <ButtonsContainer>
        {opportunity && (
          <OpportunityAvailableCTA client={client} opportunity={opportunity} />
        )}
      </ButtonsContainer>
    </SidePanelContents>
  );
};

const CongratulatedAnotherWayView = function CongratulatedAnotherWayView({
  client,
  closeModal,
}: CongratulatedSidePanelProps) {
  const statusUpdatedBy = client.milestoneMessagesUpdates?.updated?.by;
  const handleUndoCongratulated = async () => {
    await client.updateMilestonesStatus(TextMessageStatuses.PENDING);
    if (closeModal) closeModal();
  };

  useHydrateOpportunities(client);
  const opportunity = client.opportunities.usCaSupervisionLevelDowngrade?.[0];

  return (
    <SidePanelContents data-testid="CongratulatedSidePanel">
      <Banner
        icon={GreenCheckmark}
        text="Congratulated"
        actionLink={<TextLink onClick={handleUndoCongratulated}>Undo</TextLink>}
      />
      <Heading person={client} />
      <ReviewInfo>
        {statusUpdatedBy} indicated that they congratulated{" "}
        {client.displayPreferredName} in-person or using another method. Great
        job!{" "}
      </ReviewInfo>
      <ButtonsContainer>
        {opportunity && (
          <OpportunityAvailableCTA client={client} opportunity={opportunity} />
        )}
      </ButtonsContainer>
    </SidePanelContents>
  );
};

const CongratulatedSidePanel = observer(function CongratulatedSidePanel({
  client,
  closeModal,
}: CongratulatedSidePanelProps): JSX.Element | null {
  const {
    milestonesMessageStatus,
    milestonesFullTextMessage,
    milestonesPhoneNumber,
  } = client;
  if (!milestonesMessageStatus) return null;

  const messageSent =
    ["IN_PROGRESS", "SUCCESS"].includes(milestonesMessageStatus) &&
    milestonesFullTextMessage &&
    milestonesPhoneNumber;

  if (messageSent) {
    return (
      <WorkflowsPreviewModal
        isOpen={!!client}
        pageContent={<MessageSentView client={client} />}
      />
    );
  }
  return (
    <WorkflowsPreviewModal
      isOpen={!!client}
      pageContent={
        <CongratulatedAnotherWayView client={client} closeModal={closeModal} />
      }
    />
  );
});

export default CongratulatedSidePanel;
