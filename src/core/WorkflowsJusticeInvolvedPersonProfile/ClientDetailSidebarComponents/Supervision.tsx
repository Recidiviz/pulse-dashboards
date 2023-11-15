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

import React from "react";

import { formatWorkflowsDate } from "../../../utils";
import { WORKFLOWS_METHODOLOGY_URL } from "../../utils/constants";
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

export function Supervision({
  client,
}: ClientProfileProps): React.ReactElement {
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
                <InfoButton
                  infoUrl={WORKFLOWS_METHODOLOGY_URL[client.stateCode]}
                />
              </InfoTooltipWrapper>
            )}
          </SecureDetailsContent>
          <PartialTime person={client} />
          <DetailsSubheading>Expiration</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(client.expirationDate)}
          </SecureDetailsContent>

          <DetailsSubheading>Assigned to</DetailsSubheading>
          <SecureDetailsContent>
            <WorkflowsOfficerName officerId={client.assignedStaffId} />
          </SecureDetailsContent>
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}
