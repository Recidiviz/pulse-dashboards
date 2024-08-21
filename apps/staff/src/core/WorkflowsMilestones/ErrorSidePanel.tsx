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

import RedExcalamationPoint from "../../assets/static/images/redExcalamation.svg?react";
import { formatWorkflowsDate } from "../../utils/formatStrings";
import { Client } from "../../WorkflowsStore";
import {
  formatPhoneNumber,
  optionalFieldToDate,
} from "../../WorkflowsStore/utils";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import Banner from "./Banner";
import {
  PhoneNumber,
  ReviewInfo,
  ReviewMessage,
  SidePanelContents,
} from "./styles";

interface ErrorViewProps {
  client: Client;
}

export const ErrorView = function ErrorView({ client }: ErrorViewProps) {
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

  return (
    <SidePanelContents>
      <Banner icon={RedExcalamationPoint} text="Message Failed." />
      <Heading person={client} />
      <ReviewInfo>
        {messageSentBy} attempted to send the following text messages to{" "}
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

interface ErrorSidePanelProps {
  client: Client;
}

const ErrorSidePanel = observer(function ErrorSidePanel({
  client,
}: ErrorSidePanelProps): JSX.Element | null {
  return (
    <WorkflowsPreviewModal
      isOpen={!!client}
      pageContent={<ErrorView client={client} />}
    />
  );
});

export default ErrorSidePanel;
