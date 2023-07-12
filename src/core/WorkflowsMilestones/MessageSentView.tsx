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
import { Dispatch, SetStateAction } from "react";

import { ReactComponent as GreenCheckmark } from "../../assets/static/images/greenCheckmark.svg";
import { ReactComponent as RedExcalamationPoint } from "../../assets/static/images/redExcalamation.svg";
import { formatWorkflowsDate } from "../../utils/formatStrings";
import { Client } from "../../WorkflowsStore";
import {
  formatPhoneNumber,
  optionalFieldToDate,
} from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsClientProfile/Heading";
import Banner from "./Banner";
import {
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
    milestonesMessageDetails,
    milestonesPhoneNumber,
  } = client;
  const messageSentBy =
    milestonesMessageDetails?.updated?.by ?? client.assignedStaffFullName;
  const messageSentOn = formatWorkflowsDate(
    optionalFieldToDate(milestonesMessageDetails?.updated?.date)
  );

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
    </SidePanelContents>
  );
};
