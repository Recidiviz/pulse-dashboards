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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { ClientEvent } from "~datatypes";

import { formatWorkflowsDate, humanReadableTitleCase } from "../../utils";
import { Code, Description, Separator, Title, Wrapper } from "./styles";

const EventList = styled.dl`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const EventHeading = styled.dt``;

const EventDetail = styled.dd`
  margin-bottom: ${rem(24)};
`;

const Metric = styled.span`
  ${typography.Sans14};
  color: ${palette.pine1};
  padding-right: ${rem(spacing.sm)};
`;

const Date = styled.span`
  ${typography.Sans14};
  color: ${palette.slate60};
`;

const ListDescription = styled(Description)`
  color: ${palette.slate85};
`;

const Event = ({
  event,
  clientEventTypes,
}: {
  event: ClientEvent;
  clientEventTypes: Set<string>;
}): React.ReactElement | null => {
  const showDescription = clientEventTypes.has(event.metricId);

  const attributes =
    event.attributes.code || event.attributes.description ? (
      <>
        {event.attributes.code && <Code>{event.attributes.code}</Code>}
        {event.attributes.code && event.attributes.description && (
          <Separator> • </Separator>
        )}
        {event.attributes.description && (
          <ListDescription>{event.attributes.description}</ListDescription>
        )}
      </>
    ) : (
      showDescription && (
        <ListDescription>NO ADDITIONAL INFORMATION AVAILABLE</ListDescription>
      )
    );

  return (
    <>
      <EventHeading>
        <Metric>{humanReadableTitleCase(event.metricId)}</Metric>
        <Date>{formatWorkflowsDate(event.eventDate)}</Date>
      </EventHeading>
      <EventDetail>{attributes}</EventDetail>
    </>
  );
};

type InsightsClientEventsListType = {
  events: ClientEvent[];
  clientEventTypes: Set<string>;
};

const InsightsClientEventsList: React.FC<InsightsClientEventsListType> = ({
  events,
  clientEventTypes,
}) => {
  if (!events) return null;

  return (
    <Wrapper>
      <Title>Record of Events</Title>
      <EventList>
        {events.map((event, index) => {
          return (
            <Event
              event={event}
              clientEventTypes={clientEventTypes}
              key={index}
            />
          );
        })}
      </EventList>
    </Wrapper>
  );
};

export default InsightsClientEventsList;
