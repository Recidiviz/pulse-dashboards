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

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionOfficerMetricEventsPresenter } from "../../OutliersStore/presenters/SupervisionOfficerMetricEventsPresenter";
import { toTitleCase } from "../../utils";
import ModelHydrator from "../ModelHydrator";
import OutliersChartCard from "../OutliersChartCard";

type MetricEventsTableWrapperProps = { officerId: string; metricId: string };
type MetricEventsTableProps = {
  presenter: SupervisionOfficerMetricEventsPresenter;
};

function withPresenter(Component: ComponentType<MetricEventsTableProps>) {
  return observer(function MetricEventsTableWrapper({
    officerId,
    metricId,
  }: MetricEventsTableWrapperProps) {
    const {
      outliersStore: { supervisionStore },
    } = useRootStore();

    if (!supervisionStore) return null;

    const presenter = new SupervisionOfficerMetricEventsPresenter(
      supervisionStore,
      officerId,
      metricId
    );

    return (
      <ModelHydrator model={presenter}>
        <Component presenter={presenter} />
      </ModelHydrator>
    );
  });
}

export const MetricEventsTable = withPresenter(
  observer(function MetricEventsTable({ presenter }: MetricEventsTableProps) {
    return (
      <OutliersChartCard
        title={`List of ${toTitleCase(presenter.eventsLabel)}`}
        hasLegend={false}
      >
        {presenter.metricId}
      </OutliersChartCard>
    );
  })
);