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
import PropTypes from "prop-types";
import React from "react";

import { COLORS } from "../../assets/scripts/constants/colors";
import { translate } from "../../utils/i18nSettings";
import BarChartWithLabels from "../BarCharts";
import { useLanternStore } from "../LanternStoreProvider";
import RevocationsByDimension from "../RevocationsByDimension";
import { VIOLATION_TYPE } from "../utils/constants";
import createGenerateChartData from "./createGenerateChartData";

const RevocationsByViolation = observer(
  function RevocationsByViolation({ containerHeight, timeDescription }, ref) {
    const { filtersStore, dataStore } = useLanternStore();
    const { revocationsChartStore } = dataStore;
    const CHART_TITLE = "Relative frequency of violation types";
    const CHART_ID = translate("revocationsByViolationChartId");

    const violationTypes = filtersStore.filterOptions[VIOLATION_TYPE].options;
    const violationLegend = {
      position: "top",
      align: "start",
      rtl: true,
      reverse: true,
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        generateLabels: () => [
          {
            text: "Technical",
            fillStyle: COLORS["lantern-medium-blue"],
            lineWidth: 0,
          },
          {
            text: "Law",
            fillStyle: COLORS["lantern-orange"],
            lineWidth: 0,
          },
        ],
      },
    };

    return (
      <RevocationsByDimension
        ref={ref}
        chartId={CHART_ID}
        dataStore={revocationsChartStore}
        containerHeight={containerHeight}
        renderChart={({ chartId, data, denominators, numerators }) => (
          <BarChartWithLabels
            data={data}
            numerators={numerators}
            denominators={denominators}
            id={chartId}
            yAxisLabel="Percent of total reported violations"
            xAxisLabel="Violation type and condition violated"
            legendOptions={violationLegend}
          />
        )}
        generateChartData={createGenerateChartData(
          revocationsChartStore.filteredData,
          violationTypes,
        )}
        chartTitle={CHART_TITLE}
        metricTitle={CHART_TITLE}
        timeDescription={timeDescription}
        dataExportLabel="Violation"
      />
    );
  },
  { forwardRef: true },
);

RevocationsByViolation.defaultProps = { containerHeight: null };

RevocationsByViolation.propTypes = {
  containerHeight: PropTypes.number,
  timeDescription: PropTypes.string.isRequired,
};

export default RevocationsByViolation;
