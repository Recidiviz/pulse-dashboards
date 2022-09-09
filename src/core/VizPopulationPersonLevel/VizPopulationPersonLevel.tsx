// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
// ===================== ========================================================
import "./VizPopulationPersonLevel.scss";

import { observer } from "mobx-react-lite";
import React from "react";
import { Column } from "react-table";

import PathwaysTable from "../../components/PathwaysTable";
import { formatDate, toHumanReadable, toTitleCase } from "../../utils";
import { useCoreStore } from "../CoreStoreProvider";
import PersonLevelMetric from "../models/PersonLevelMetric";
import PrisonPopulationPersonLevelMetric from "../models/PrisonPopulationPersonLevelMetric";
import { TableColumn } from "../types/charts";
import { PopulationFilterLabels } from "../types/filters";
import withMetricHydrator from "../withMetricHydrator";

type VizPopulationPersonLevelProps = {
  metric: PrisonPopulationPersonLevelMetric | PersonLevelMetric;
};

const VizPopulationPersonLevel: React.FC<VizPopulationPersonLevelProps> = ({
  metric,
}) => {
  const { filtersStore } = useCoreStore();
  const { getFilterLabel } = filtersStore;
  const { dataSeries, chartTitle, columns, id } = metric;
  if (!columns) return null;

  const latestUpdate = formatDate(
    metric instanceof PersonLevelMetric
      ? metric.lastUpdated
      : dataSeries[0]?.lastUpdated,
    "MMMM dd, yyyy"
  );

  const createTableColumn = (column: TableColumn): Column => {
    const { useTitleCase, useFilterLabels, accessor } = column;

    if (useFilterLabels) {
      return {
        ...column,
        Cell: ({ value }: { value: string }) => (
          <div>
            {getFilterLabel(accessor as keyof PopulationFilterLabels, value)}
          </div>
        ),
      };
    }

    if (useTitleCase) {
      return {
        ...column,
        Cell: ({ value }: { value: string }) => (
          <div>{toTitleCase(toHumanReadable(value))}</div>
        ),
      };
    }

    return column;
  };

  return (
    <div className="VizPopulationPersonLevel">
      <div className="VizPopulationPersonLevel__header">
        <div className="VizPopulationPersonLevel__title">
          {chartTitle} <span>as of {latestUpdate}</span>
        </div>
        <div className="VizPopulationPersonLevel__title">
          Total: {dataSeries.length.toLocaleString()}{" "}
          {id.includes("prisonToSupervision") ? "releases" : "people"}
        </div>
      </div>
      <div className="VizPopulationPersonLevel__table">
        <PathwaysTable
          columns={columns.map((c) => createTableColumn(c))}
          data={dataSeries}
        />
      </div>
    </div>
  );
};

export default withMetricHydrator(observer(VizPopulationPersonLevel));
