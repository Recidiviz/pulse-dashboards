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
import { ComponentType } from "react";
import { Column } from "react-table";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionOfficerMetricEvent } from "../../OutliersStore/models/SupervisionOfficerMetricEvent";
import { SupervisionOfficerMetricEventsPresenter } from "../../OutliersStore/presenters/SupervisionOfficerMetricEventsPresenter";
import { formatDate, toTitleCase } from "../../utils";
import ModelHydrator from "../ModelHydrator";
import OutliersChartCard from "../OutliersChartCard";
import OutliersTable from "../OutliersTable";
import { FullName } from "../types/personMetadata";

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
      outliersStore: { supervisionStore },
    } = useRootStore();

    if (!supervisionStore) return null;

    const presenter = new SupervisionOfficerMetricEventsPresenter(
      supervisionStore,
      officerPseudoId,
      metricId
    );

    return (
      <ModelHydrator model={presenter}>
        <Component presenter={presenter} />
      </ModelHydrator>
    );
  });
}

const columns = [
  {
    title: "Name",
    accessor: "clientName",
  },
  {
    title: "ID",
    accessor: "clientId",
    width: 60,
  },
  {
    title: "Date",
    accessor: "eventDate",
    width: 60,
  },
];

const createTableColumn = (column: Column) => {
  const { accessor } = column;

  switch (accessor) {
    case "clientName":
      return {
        ...column,
        Cell: ({ value }: { value: FullName }) =>
          `${value.givenNames} ${value.surname}`,
      };
    case "eventDate":
      return {
        ...column,
        Cell: ({ value }: { value: Date }) => formatDate(value),
      };
    default:
      return column;
  }
};

export const MetricEventsTable = withPresenter(
  observer(function MetricEventsTable({ presenter }: MetricEventsTableProps) {
    return (
      <OutliersChartCard
        title={`List of ${toTitleCase(presenter.eventsLabel)}`}
        hasLegend={false}
      >
        <OutliersTable<SupervisionOfficerMetricEvent>
          data={presenter.officerMetricEvents}
          columns={columns.map((c) => createTableColumn(c))}
        />
      </OutliersChartCard>
    );
  })
);
