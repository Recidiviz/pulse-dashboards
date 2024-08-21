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
import { Dispatch, SetStateAction, useState } from "react";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { TextMessageStatuses } from "../../FirestoreStore";
import { Client } from "../../WorkflowsStore";
import { validatePhoneNumber } from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import { ClientMilestones } from "./MilestonesCaseloadView";
import { NEW_MILESTONES_SIDE_PANEL_VIEW } from "./NewMilestonesSidePanel";
import PhoneNumberInput from "./PhoneNumberInput";
import {
  ActionButton,
  AlreadyCongratulatedButton,
  ButtonsContainer,
  OptOutText,
  SidePanelContents,
  SidePanelHeader,
  TextLink,
  Warning,
  WideTooltipTrigger,
} from "./styles";
import TextMessageInput from "./TextMessageInput";

interface ComposeMessageProps {
  client: Client;
  setCurrentView: Dispatch<SetStateAction<NEW_MILESTONES_SIDE_PANEL_VIEW>>;
}

const ComposeMessageView = observer(function ComposeMessageView({
  client,
  setCurrentView,
}: ComposeMessageProps): JSX.Element {
  const { usCaEnableSMS } = useFeatureVariants();
  const { analyticsStore } = useRootStore();

  const [disableReviewButton, setDisableReviewButton] = useState(
    !validatePhoneNumber(client.milestonesPhoneNumber),
  );

  const handleUpdatePhoneNumber = async (updatedPhoneNumber: string) => {
    const invalidPhoneNumber = !validatePhoneNumber(updatedPhoneNumber);
    setDisableReviewButton(invalidPhoneNumber);
    await client.updateMilestonesPhoneNumber(
      updatedPhoneNumber,
      invalidPhoneNumber,
    );
  };

  const handleUpdateTextMessage = async (additionalMessage: string) => {
    const deletePendingMessage = additionalMessage === "";
    await client.updateMilestonesTextMessage(
      additionalMessage,
      deletePendingMessage,
    );
  };

  const handleOnReviewClick = async () => {
    await client.updateMilestonesTextMessage(client.milestonesPendingMessage);
    setCurrentView("REVIEWING");
  };

  const handleOnCongratulatedClick = async () => {
    await client.updateMilestonesStatus(
      TextMessageStatuses.CONGRATULATED_ANOTHER_WAY,
    );
    analyticsStore.trackMilestonesCongratulatedAnotherWay({
      justiceInvolvedPersonId: client.pseudonymizedId,
    });
    setCurrentView("CONGRATULATED_ANOTHER_WAY");
  };

  return (
    <SidePanelContents data-testid="ComposeMessageView">
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
        {usCaEnableSMS ? (
          <ActionButton
            onClick={handleOnReviewClick}
            disabled={disableReviewButton}
          >
            Review and Send
          </ActionButton>
        ) : (
          <WideTooltipTrigger
            contents={
              <>
                Text messaging is temporarily unavailable
                <br /> while we make some configuration changes.
              </>
            }
          >
            <ActionButton disabled>Review and Send</ActionButton>
          </WideTooltipTrigger>
        )}
        <AlreadyCongratulatedButton onClick={handleOnCongratulatedClick}>
          I congratulated them in-person or another way
        </AlreadyCongratulatedButton>
        <OptOutText>
          Opt out of sending a congratulations text?{" "}
          <TextLink onClick={() => setCurrentView("DECLINING")}>
            Tell us why
          </TextLink>
        </OptOutText>
      </ButtonsContainer>
    </SidePanelContents>
  );
});

export default ComposeMessageView;
