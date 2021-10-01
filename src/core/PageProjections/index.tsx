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
// =============================================================================
import { observer } from "mobx-react-lite";
import React from "react";
import { useLocation } from "react-router-dom";

import { useCoreStore } from "../CoreStoreProvider";
import { SimulationCompartment } from "../models/types";
import PageTemplate from "../PageTemplate";
import PathwaysFilterBar from "../PathwaysFilterBar/PathwaysFilterBar";
import PopulationSummaryMetrics from "../PopulationSummaryMetrics";
import PopulationTimeSeriesChart from "../PopulationTimeSeriesChart";
import filterOptions from "../utils/filterOptions";
import { getCompartmentFromView, getViewFromPathname } from "../views";
import PopulationProjectionLastUpdated from "./PopulationProjectionLastUpdated";

const PageProjections: React.FC = () => {
  const view = getViewFromPathname(useLocation().pathname);
  const compartment: SimulationCompartment = getCompartmentFromView(view);
  const { currentTenantId, metricsStore } = useCoreStore();
  const model = metricsStore.projections;
  const { isLoading, isError, simulationDate } = model;
  const { pageProjectionsStore } = useCoreStore();
  const { downloadData, enabledFilters } = pageProjectionsStore;
  const filteredData = metricsStore.projections.getFilteredDataByView(view);

  const populationType =
    compartment === "SUPERVISION" ? "Supervised" : "Incarcerated";

  return (
    <PageTemplate
      filters={
        <PathwaysFilterBar
          // @ts-ignore
          filterOptions={filterOptions[currentTenantId]}
          enabledFilters={enabledFilters}
          handleDownload={downloadData}
        />
      }
    >
      <PopulationSummaryMetrics
        data={filteredData}
        simulationDate={simulationDate}
        isError={isError}
        isLoading={isLoading}
      />
      <PopulationProjectionLastUpdated
        simulationDate={simulationDate}
        isLoading={isLoading}
      />
      <PopulationTimeSeriesChart
        metric={model}
        title={`Total ${populationType} Population`}
        data={filteredData}
      />
    </PageTemplate>
  );
};

export default observer(PageProjections);
