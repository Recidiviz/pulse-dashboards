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
import { ComponentType, useEffect, useRef, useState } from "react";
import { Column } from "react-table";
import styled from "styled-components/macro";

import { FullName, SupervisionOfficerMetricEvent } from "~datatypes";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerMetricEventsPresenter } from "../../InsightsStore/presenters/SupervisionOfficerMetricEventsPresenter";
import { formatDate } from "../../utils";
import InsightsClientDetailsPanel from "../InsightsClientDetailsPanel";
import InsightsTable from "../InsightsTable";
import ModelHydrator from "../ModelHydrator";
import PersonId from "../PersonId";

const Wrapper = styled.div`
  max-height: 555px;
  overflow-y: hidden;
  overflow-x: hidden;
`;

type MetricEventsTableWrapperProps = {
  officerPseudoId: string;
  metricId: string;
};
type MetricEventsTableProps = {
  presenter: SupervisionOfficerMetricEventsPresenter;
};

function withPresenter(Component: ComponentType<MetricEventsTableProps>) {
  return observer(function MetricEventsTableWrapper({
    officerPseudoId,
    metricId,
  }: MetricEventsTableWrapperProps) {
    const {
      insightsStore: { supervisionStore },
    } = useRootStore();

    if (!supervisionStore) return null;

    const presenter = new SupervisionOfficerMetricEventsPresenter(
      supervisionStore,
      officerPseudoId,
      metricId,
    );

    return (
      <ModelHydrator hydratable={presenter}>
        <Component presenter={presenter} />
      </ModelHydrator>
    );
  });
}

const createTableColumn = (
  column: Column,
  clientDetailLinks: string[] | undefined,
  docLabel: string,
): Column => {
  const { accessor } = column;

  switch (accessor) {
    case "clientName":
      return {
        ...column,
        Cell: ({ value }: { value: FullName }) => (
          <>
            {value.givenNames} {value.surname}
          </>
        ),
      };
    case "eventDate":
      return {
        ...column,
        Cell: ({ value }: { value: Date }) => <>{formatDate(value)}</>,
      };
    case "clientId":
      return clientDetailLinks
        ? column
        : {
            ...column,
            Cell: ({ value }: { value: string }) => (
              <PersonId personId={value} docLabel={docLabel} shiftIcon>
                {value}
              </PersonId>
            ),
          };
    default:
      return column;
  }
};

export const MetricEventsTable = withPresenter(
  observer(function MetricEventsTable({ presenter }: MetricEventsTableProps) {
    const { isMobile } = useIsMobile(true);
    const {
      officerMetricEvents,
      clientDetailLinks,
      hideEventDateColumn,
      labels,
    } = presenter;
    const scrollElementRef = useRef(null);
    const [scrollElement, setScrollElement] = useState(null);

    useEffect(() => {
      setScrollElement(scrollElementRef.current);
    }, [scrollElementRef]);

    const columns = [
      {
        title: "Name",
        accessor: "clientName",
        width: isMobile ? 40 : 120,
      },
      {
        title: "ID",
        accessor: "clientId",
        width: isMobile ? 40 : 70,
      },
      {
        title: "Date",
        accessor: "eventDate",
        width: isMobile ? 40 : 60,
      },
    ];

    if (hideEventDateColumn) columns.splice(-1);

    return (
      <>
        <Wrapper ref={scrollElementRef}>
          <InsightsTable<SupervisionOfficerMetricEvent>
            data={officerMetricEvents}
            columns={columns.map((c) =>
              createTableColumn(c, clientDetailLinks, labels.docLabel),
            )}
            rowLinks={clientDetailLinks}
            scrollElement={scrollElement}
            intercomTargetOnFirstRow="First client"
          />
        </Wrapper>

        <InsightsClientDetailsPanel />
      </>
    );
  }),
);
