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
import "./VizIncarcerationPopulationPersonLevel.scss";

import { max } from "lodash/fp";
import { observer } from "mobx-react-lite";
import React from "react";

import PathwaysTable from "../../components/PathwaysTable";
import { formatDate } from "../../utils";
import IncarcerationPopulationPersonLevelMetric from "../models/IncarcerationPopulationPersonLevelMetric";
import withMetricHydrator from "../withMetricHydrator";

type VizIncarcerationPopulationPersonLevelProps = {
  metric: IncarcerationPopulationPersonLevelMetric;
};

const VizIncarcerationPopulationPersonLevel: React.FC<VizIncarcerationPopulationPersonLevelProps> = ({
  metric,
}) => {
  const { dataSeries, chartTitle } = metric;

  const latestUpdate = max(dataSeries.map((d) => d.lastUpdated)) || new Date();
  const columns = React.useMemo(
    () => [
      {
        Header: "Name",
        accessor: "fullName",
      },
      {
        Header: "DOC ID",
        accessor: "stateId",
      },
      {
        Header: "Gender",
        accessor: "gender",
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
      },
    ],
    []
  );

  return (
    <div className="VizIncarcerationPopulationPersonLevel">
      <div className="VizIncarcerationPopulationPersonLevel__header">
        <div className="VizIncarcerationPopulationPersonLevel__title">
          {chartTitle}{" "}
          <span>as of {formatDate(latestUpdate, "MMMM dd, yyyy")}</span>
        </div>
        <div className="VizIncarcerationPopulationPersonLevel__title">
          Total: {dataSeries.length} people
        </div>
      </div>
      <div className="VizIncarcerationPopulationPersonLevel__table">
        <PathwaysTable columns={columns} data={dataSeries} />
      </div>
    </div>
  );
};

export default withMetricHydrator(
  observer(VizIncarcerationPopulationPersonLevel)
);
