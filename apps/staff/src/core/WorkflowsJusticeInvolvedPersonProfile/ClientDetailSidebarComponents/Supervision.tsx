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

import React from "react";

import { useRootStore } from "../../../components/StoreProvider";
import { formatWorkflowsDate } from "../../../utils";
import WorkflowsOfficerName from "../../WorkflowsOfficerName";
import { InfoButton } from "../InfoButton";
import { PartialTime } from "../PartialTime";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  InfoTooltipWrapper,
  SecureDetailsContent,
} from "../styles";
import { ClientProfileProps } from "../types";
import { UsNeSupervisionDetails } from "./US_NE/UsNeSupervisionDetails";

export function Supervision({
  client,
}: ClientProfileProps): React.ReactElement {
  const {
    tenantStore: {
      labels: { supervisionEndDateCopy },
      workflowsMethodologyUrl,
    },
  } = useRootStore();
  const tooltip = client.detailsCopy?.supervisionStartDate?.tooltip;

  return (
    <DetailsSection>
      <DetailsHeading>Supervision</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Start</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(client.supervisionStartDate)}{" "}
            {tooltip && (
              <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                <InfoButton infoUrl={workflowsMethodologyUrl} />
              </InfoTooltipWrapper>
            )}
          </SecureDetailsContent>
          <PartialTime person={client} />
          <DetailsSubheading>{supervisionEndDateCopy}</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(client.expirationDate)}
          </SecureDetailsContent>
          <StateSpecificSupervisionDetails client={client} />

          <DetailsSubheading>Assigned to</DetailsSubheading>
          <SecureDetailsContent>
            <WorkflowsOfficerName officerId={client.assignedStaffId} />
          </SecureDetailsContent>

          {client.sentencedBy && (
            <>
              <DetailsSubheading>Sentenced by</DetailsSubheading>
              <SecureDetailsContent>{client.sentencedBy}</SecureDetailsContent>
            </>
          )}

          {client.supervisedIn && (
            <>
              <DetailsSubheading>Supervised in</DetailsSubheading>
              <SecureDetailsContent>{client.supervisedIn}</SecureDetailsContent>
            </>
          )}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

function StateSpecificSupervisionDetails({
  client,
}: ClientProfileProps): React.ReactElement | null {
  switch (client.stateCode) {
    case "US_NE":
      return <UsNeSupervisionDetails client={client} />;
    default:
      return null;
  }
}
