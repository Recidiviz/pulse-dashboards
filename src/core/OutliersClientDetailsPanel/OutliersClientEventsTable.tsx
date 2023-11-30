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
import { rem } from "polished";
import { Column } from "react-table";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { rawClientEventFixture } from "../../OutliersStore/models/offlineFixtures/ClientEventFixture";
import { SupervisionOfficerMetricEvent } from "../../OutliersStore/models/SupervisionOfficerMetricEvent";
import { formatDate, humanReadableTitleCase } from "../../utils";
import OutliersTable from "../OutliersTable";

const Wrapper = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  border-top: 1px solid ${palette.slate10};
`;

const Title = styled.div`
  ${typography.Sans16};
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
`;

const Code = styled.span`
  color: ${palette.slate85};
`;

const Separator = styled.span`
  color: ${palette.slate85};
`;

const Description = styled.span`
  color: ${palette.slate60};
`;

const columns = [
  {
    title: "Date",
    accessor: "eventDate",
    width: 60,
  },
  {
    title: "Event",
    accessor: "metricId",
    width: 90,
  },
  {
    title: "Description",
    accessor: "attributes",
  },
];

const createTableColumn = (column: Column) => {
  const { accessor } = column;

  switch (accessor) {
    case "attributes":
      return {
        ...column,
        Cell: ({ value }: { value: any }) => {
          if (!value)
            return (
              <Description>NO ADDITIONAL INFORMATION AVAILABLE</Description>
            );

          if (value.code)
            return (
              <>
                <Code>{value.code}</Code>
                <Separator> • </Separator>
                <Description>{value.description}</Description>
              </>
            );

          return value.description;
        },
      };
    case "eventDate":
      return {
        ...column,
        Cell: ({ value }: { value: string }) => formatDate(new Date(value)),
      };
    case "metricId":
      return {
        ...column,
        Cell: ({ value }: { value: string }) => humanReadableTitleCase(value),
      };
    default:
      return column;
  }
};

type OutliersClientEventsTableType = {
  scrollElement: React.ReactNode;
  event?: SupervisionOfficerMetricEvent;
};

const OutliersClientEventsTable: React.FC<OutliersClientEventsTableType> = ({
  scrollElement,
  event,
}) => {
  const { isMobile } = useIsMobile(true);
  const clientEvents = rawClientEventFixture;

  if (!event) return null;

  return (
    <Wrapper>
      <Title>Record of Events</Title>
      <OutliersTable
        data={clientEvents}
        columns={columns.map((c) => createTableColumn(c))}
        rowSize={isMobile ? 110 : 76}
        transformToMobile={isMobile}
        scrollElement={scrollElement}
      />
    </Wrapper>
  );
};

export default OutliersClientEventsTable;
