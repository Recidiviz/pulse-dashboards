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

import { palette, spacing, typography } from "@recidiviz/design-system";
import moment from "moment";
import pluralize from "pluralize";
import { rem } from "polished";
import styled from "styled-components/macro";

import { RawClientInfo } from "../../OutliersStore/models/ClientInfo";
import { rawClientInfoFixture } from "../../OutliersStore/models/offlineFixtures/ClientInfoFixture";
import { SupervisionOfficerMetricEvent } from "../../OutliersStore/models/SupervisionOfficerMetricEvent";
import { formatWorkflowsDate, toTitleCase } from "../../utils";

const Wrapper = styled.div``;

const DetailsSection = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};

  &:not(:last-child) {
    border-bottom: 1px solid ${palette.slate10};
  }
`;

const DetailsHeading = styled.div`
  ${typography.Sans16};
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
`;

const DetailsList = styled.div<{ direction?: "row" | "column" }>`
  display: flex;
  flex-direction: ${({ direction }) => direction ?? "row"};
  column-gap: ${rem(spacing.xl)};
  row-gap: ${rem(spacing.sm)};
  flex-wrap: wrap;
`;

const Detail = styled.div`
  ${typography.Sans14};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

const DetailTitle = styled.div`
  color: ${palette.slate60};
`;

const DetailContent = styled.div`
  color: ${palette.slate85};
`;

function ClientDetails({
  client,
}: {
  client: RawClientInfo;
}): React.ReactElement | null {
  const { raceOrEthnicity, gender, birthdate } = client;

  if (!client) return null;

  return (
    <DetailsSection>
      <DetailsHeading>Client Details</DetailsHeading>
      <DetailsList>
        <Detail>
          <DetailTitle>Race / Ethnicity</DetailTitle>
          <DetailContent>{toTitleCase(raceOrEthnicity)}</DetailContent>
        </Detail>

        <Detail>
          <DetailTitle>Gender</DetailTitle>
          <DetailContent>{toTitleCase(gender)}</DetailContent>
        </Detail>

        <Detail>
          <DetailTitle>Age</DetailTitle>
          <DetailContent>
            {moment().diff(moment(birthdate), "years")} years
          </DetailContent>
        </Detail>
      </DetailsList>
    </DetailsSection>
  );
}

function SupervisionDetails({
  client,
  event,
  eventsLabel,
}: {
  client: RawClientInfo;
  event: SupervisionOfficerMetricEvent;
  eventsLabel: string;
}): React.ReactElement | null {
  const { supervisionStart, supervisionType, officerAssignmentStart } = client;

  if (!client) return null;

  return (
    <DetailsSection>
      <DetailsHeading>Supervision Details</DetailsHeading>
      <DetailsList direction="column">
        <Detail>
          <DetailTitle>{toTitleCase(supervisionType)} Start Date</DetailTitle>
          <DetailContent>
            {formatWorkflowsDate(new Date(supervisionStart))}
          </DetailContent>
        </Detail>

        <Detail>
          <DetailTitle>
            {/* TODO(#4357) Read singular label from config */}
            Date of {toTitleCase(pluralize.singular(eventsLabel))}
          </DetailTitle>
          <DetailContent>{formatWorkflowsDate(event.eventDate)}</DetailContent>
        </Detail>

        <Detail>
          <DetailTitle>Assigned to Officer</DetailTitle>
          <DetailContent>
            {formatWorkflowsDate(new Date(officerAssignmentStart))}
          </DetailContent>
        </Detail>
      </DetailsList>
    </DetailsSection>
  );
}

type OutliersClientDetailsType = {
  eventsLabel: string;
  event?: SupervisionOfficerMetricEvent;
};

const OutliersClientDetails: React.FC<OutliersClientDetailsType> = ({
  eventsLabel,
  event,
}) => {
  if (!event) return null;

  const client = rawClientInfoFixture[event.clientId];

  return (
    <Wrapper>
      <ClientDetails client={client} />
      <SupervisionDetails
        eventsLabel={eventsLabel}
        event={event}
        client={client}
      />
    </Wrapper>
  );
};

export default OutliersClientDetails;
