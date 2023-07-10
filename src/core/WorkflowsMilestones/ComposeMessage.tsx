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
import { Dispatch, SetStateAction, useState } from "react";

import { Client } from "../../WorkflowsStore";
import { validatePhoneNumber } from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsClientProfile/Heading";
import { ClientMilestones } from "./MilestonesCaseloadView";
import { NEW_MILESTONES_SIDE_PANEL_VIEW } from "./MilestonesSidePanel";
import PhoneNumberInput from "./PhoneNumberInput";
import {
  ActionButton,
  AlreadyCongratulatedButton,
  ButtonsContainer,
  OptOutLink,
  OptOutText,
  SidePanelContents,
  SidePanelHeader,
  Warning,
} from "./styles";
import TextMessageInput from "./TextMessageInput";

interface ComposeMessageProps {
  client: Client;
  setCurrentView: Dispatch<SetStateAction<NEW_MILESTONES_SIDE_PANEL_VIEW>>;
}

const ComposeMessage = observer(function ComposeMessage({
  client,
  setCurrentView,
}: ComposeMessageProps): JSX.Element {
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
        client={client}
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
});

export default ComposeMessage;
