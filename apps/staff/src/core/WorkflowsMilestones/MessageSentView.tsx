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

import { useContext } from "react";

import GreenCheckmark from "../../assets/static/images/greenCheckmark.svg?react";
import useHydrateOpportunities from "../../hooks/useHydrateOpportunities";
import { formatWorkflowsDate } from "../../utils/formatStrings";
import { Client } from "../../WorkflowsStore";
import {
  formatPhoneNumber,
  optionalFieldToDate,
} from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import WorkflowsPreviewModalContext from "../WorkflowsPreviewModal/WorkflowsPreviewModalContext";
import Banner from "./Banner";
import OpportunityAvailableCTA from "./OpportunityAvailableCTA";
import {
  ButtonsContainer,
  ButtonWithLoader,
  PhoneNumber,
  ReviewInfo,
  ReviewMessage,
  SidePanelContents,
} from "./styles";

interface MessageSentViewProps {
  client: Client;
}

export const MessageSentView = function MessageSentView({
  client,
}: MessageSentViewProps) {
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

  // Hydrate opportunities for the client
  useHydrateOpportunities(client);
  const opportunity = client.opportunities.usCaSupervisionLevelDowngrade;

  // Auto dismiss for the modal if the modal is open and hasAutoDismiss is true,
  const modalContext = useContext(WorkflowsPreviewModalContext);
  const { setDismissAfterMs, setModalIsOpen } = modalContext;

  const closeModalTimeoutMs = opportunity ? 10000 : 4000;
  setDismissAfterMs(closeModalTimeoutMs);

  return (
    <SidePanelContents>
      <Banner icon={GreenCheckmark} text="Message Sent!" />
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
      <ButtonsContainer>
        {opportunity && (
          <OpportunityAvailableCTA client={client} opportunity={opportunity} />
        )}
        {closeModalTimeoutMs && (
          <ButtonWithLoader
            onClick={() => setModalIsOpen(false)}
            loadingTimeMS={closeModalTimeoutMs}
          >
            Close
          </ButtonWithLoader>
        )}
      </ButtonsContainer>
    </SidePanelContents>
  );
};
