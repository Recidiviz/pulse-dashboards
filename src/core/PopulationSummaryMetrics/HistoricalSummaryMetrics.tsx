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
import React from "react";
import { observer } from "mobx-react-lite";
import MetricsCard from "../MetricsCard";
import SummaryMetrics from "./SummaryMetrics";
import { usePopulationFiltersStore } from "../../components/StoreProvider";
import type { HistoricalSummaryRecord } from "../models/types";

const HistoricalSummaryMetrics: React.FC<{
  data?: HistoricalSummaryRecord;
  isLoading: boolean;
}> = ({ data, isLoading }) => {
  const { timePeriodLabel } = usePopulationFiltersStore();

  return (
    <MetricsCard heading={`Past ${timePeriodLabel}`}>
      <SummaryMetrics data={data} isLoading={isLoading} />
    </MetricsCard>
  );
};

export default observer(HistoricalSummaryMetrics);
