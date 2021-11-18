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

import PathwaysTable from "../../components/PathwaysTable";
import { formatDate, toHumanReadable, toTitleCase } from "../../utils";
import PrisonPopulationPersonLevelMetric from "../models/PrisonPopulationPersonLevelMetric";
import withMetricHydrator from "../withMetricHydrator";

type VizPopulationPersonLevelProps = {
  metric: PrisonPopulationPersonLevelMetric;
};

const VizPopulationPersonLevel: React.FC<VizPopulationPersonLevelProps> = ({
  metric,
}) => {
  const { dataSeries, chartTitle } = metric;

  const latestUpdate = formatDate(dataSeries[0]?.lastUpdated, "MMMM dd, yyyy");
  const columns = React.useMemo(
    () => [
      {
        Header: "Name",
        accessor: "fullName",
        Cell: ({ value }: { value: string }) => <div>{toTitleCase(value)}</div>,
      },
      {
        Header: "DOC ID",
        accessor: "stateId",
      },
      {
        Header: "Gender",
        accessor: "gender",
        Cell: ({ value }: { value: string }) => <div>{toTitleCase(value)}</div>,
      },
      {
        Header: "Age",
        accessor: "age",
      },
      {
        Header: "Facility",
        accessor: "facility",
      },
      {
        Header: "Admission Reason",
        accessor: "legalStatus",
        Cell: ({ value }: { value: string }) => (
          <div>{toTitleCase(toHumanReadable(value))}</div>
        ),
      },
    ],
    []
  );

  return (
    <div className="VizPopulationPersonLevel">
      <div className="VizPopulationPersonLevel__header">
        <div className="VizPopulationPersonLevel__title">
          {chartTitle} <span>as of {latestUpdate}</span>
        </div>
        <div className="VizPopulationPersonLevel__title">
          Total: {dataSeries.length.toLocaleString()} people
        </div>
      </div>
      <div className="VizPopulationPersonLevel__table">
        <PathwaysTable columns={columns} data={dataSeries} />
      </div>
    </div>
  );
};

export default withMetricHydrator(observer(VizPopulationPersonLevel));
