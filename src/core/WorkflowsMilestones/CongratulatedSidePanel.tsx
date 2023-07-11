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

import { ReactComponent as GreenCheckmark } from "../../assets/static/images/greenCheckmark.svg";
import { formatWorkflowsDate } from "../../utils/formatStrings";
import { Client } from "../../WorkflowsStore";
import {
  formatPhoneNumber,
  optionalFieldToDate,
} from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsClientProfile/Heading";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import Banner from "./Banner";
import {
  PhoneNumber,
  ReviewInfo,
  ReviewMessage,
  SidePanelContents,
} from "./styles";

interface CongratulatedSidePanelProps {
  client: Client;
}

const MessageSentView = function MessageSentView({
  client,
}: CongratulatedSidePanelProps) {
  const {
    milestonesFullTextMessage,
    milestonesMessageDetails,
    milestonesPhoneNumber,
  } = client;
  const messageSentBy =
    milestonesMessageDetails?.updated?.by ?? client.assignedStaffFullName;
  const messageSentOn = formatWorkflowsDate(
    optionalFieldToDate(milestonesMessageDetails?.updated?.date)
  );
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
    </SidePanelContents>
  );
};

const CongratulatedAnotherWayView = function CongratulatedAnotherWayView({
  client,
}: CongratulatedSidePanelProps) {
  const statusUpdatedBy = client.milestoneMessagesUpdates?.updated?.by;

  return (
    <SidePanelContents data-testid="CongratulatedSidePanel">
      <Heading person={client} />
      <ReviewInfo>
        {statusUpdatedBy} indicated that they congratulated{" "}
        {client.displayPreferredName} in-person or using another method. Great
        job!{" "}
      </ReviewInfo>
    </SidePanelContents>
  );
};

const CongratulatedSidePanel = observer(function CongratulatedSidePanel({
  client,
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
      pageContent={<CongratulatedAnotherWayView client={client} />}
    />
  );
});

export default CongratulatedSidePanel;
