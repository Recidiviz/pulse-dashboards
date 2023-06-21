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
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
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

const ButtonsContainer = styled.div<{ isMobile?: boolean }>`
  ${typography.Sans14}

  position: ${({ isMobile }) => (isMobile ? "relative" : "absolute")};
  bottom: ${({ isMobile }) => (isMobile ? "unset" : "0")};
  width: 100%;
`;

const ReviewButton = styled(Button)`
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

  :hover {
    color: ${palette.marble1};
  }
`;

const OptOutText = styled.div`
  padding-bottom: 1.5rem;
`;
const OptOutLink = styled.span`
  text-decoration: underline;
  cursor: pointer;
`;

const SidePanelContents = styled.div`
  height: 90vh;
  position: relative;
`;

export const MilestonesSidePanel = observer(function TaskPreviewModal() {
  const {
    workflowsStore: { selectedClient },
  } = useRootStore();

  const { isMobile } = useIsMobile(true);

  if (!selectedClient) return null;

  const handleUpdatePhoneNumber = (phoneNumber: string) => {
    return phoneNumber;
  };

  const handleUpdateTextMessage = (textMessage: string) => {
    return textMessage;
  };

  return (
    <WorkflowsPreviewModal
      isOpen={!!selectedClient}
      pageContent={
        <SidePanelContents>
          <Heading person={selectedClient} />
          <SidePanelHeader>Milestones</SidePanelHeader>
          <ClientMilestones client={selectedClient} showAll />
          <PhoneNumberInput
            client={selectedClient}
            onUpdatePhoneNumber={handleUpdatePhoneNumber}
          />
          <TextMessageInput
            client={selectedClient}
            onUpdateTextMessage={handleUpdateTextMessage}
          />
          <Warning>
            Do not send critical information tied to deadlines. We cannot
            guarantee delivery of this text message.
          </Warning>
          <ButtonsContainer isMobile={isMobile}>
            <ReviewButton>Review</ReviewButton>
            <AlreadyCongratulatedButton>
              I congratulated them in-person or another way
            </AlreadyCongratulatedButton>
            <OptOutText>
              Opt out of sending a congratulations text?{" "}
              <OptOutLink>Tell us why</OptOutLink>
            </OptOutText>
          </ButtonsContainer>
        </SidePanelContents>
      }
    />
  );
});
