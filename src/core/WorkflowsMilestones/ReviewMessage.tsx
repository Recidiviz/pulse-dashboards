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
import { Dispatch, SetStateAction } from "react";

import useHydrateOpportunities from "../../hooks/useHydrateOpportunities";
import { Client } from "../../WorkflowsStore";
import { formatPhoneNumber } from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsClientProfile/Heading";
import { NEW_MILESTONES_SIDE_PANEL_VIEW } from "./NewMilestonesSidePanel";
import {
  ActionButton,
  ButtonsContainer,
  PhoneNumber,
  ReviewInfo,
  ReviewMessage,
  SidePanelContents,
} from "./styles";

interface ReviewMessageProps {
  client: Client;
  setCurrentView: Dispatch<SetStateAction<NEW_MILESTONES_SIDE_PANEL_VIEW>>;
}

const ReviewMessageView = observer(function ReviewMessageView({
  client,
  setCurrentView,
}: ReviewMessageProps): JSX.Element {
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
export default ReviewMessageView;
