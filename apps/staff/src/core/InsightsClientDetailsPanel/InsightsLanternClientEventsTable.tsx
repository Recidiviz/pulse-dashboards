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

import { Column } from "react-table";

import { ClientEvent, ClientEventAttributes } from "~datatypes";

import useIsMobile from "../../hooks/useIsMobile";
import { formatDate, humanReadableTitleCase } from "../../utils";
import InsightsTable from "../InsightsTable";
import { Code, Description, Separator, Title, Wrapper } from "./styles";

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

const createTableColumn = (column: Column): Column => {
  const { accessor } = column;

  switch (accessor) {
    case "attributes":
      return {
        ...column,
        Cell: ({ value }: { value: ClientEventAttributes }) => {
          if (value.code && value.description)
            return (
              <>
                <Code>{value.code}</Code>
                <Separator> • </Separator>
                <Description>{value.description}</Description>
              </>
            );

          if (value.code) return <Code>{value.code}</Code>;
          if (value.description) return <>{value.description}</>;

          return <Description>NO ADDITIONAL INFORMATION AVAILABLE</Description>;
        },
      };
    case "eventDate":
      return {
        ...column,
        Cell: ({ value }: { value: string }) => (
          <>{formatDate(new Date(value))}</>
        ),
      };
    case "metricId":
      return {
        ...column,
        Cell: ({ value }: { value: string }) => (
          <>{humanReadableTitleCase(value)}</>
        ),
      };
    default:
      return column;
  }
};

type InsightsLanternClientEventsTableType = {
  events: ClientEvent[];
  supervisorHomepage: boolean;
};

const InsightsLanternClientEventsTable: React.FC<
  InsightsLanternClientEventsTableType
> = ({ events, supervisorHomepage }) => {
  const { isMobile } = useIsMobile(true);
  if (!events) return null;

  return (
    <Wrapper>
      <Title>Record of Events</Title>
      <InsightsTable
        data={events}
        columns={columns.map((c) => createTableColumn(c))}
        rowSize={isMobile || supervisorHomepage ? 110 : 76}
        transformToMobile={isMobile || supervisorHomepage}
        supervisorHomepage={supervisorHomepage}
      />
    </Wrapper>
  );
};

export default InsightsLanternClientEventsTable;
