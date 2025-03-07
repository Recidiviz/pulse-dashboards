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

import flags from "../../flags";
import { translate } from "../../utils/i18nSettings";
import { useDataStore } from "../LanternStoreProvider";
import PercentRevokedChart from "../PercentRevokedChart";
import RevocationCountChart from "../RevocationCountChart";
import RevocationsByDimension from "../RevocationsByDimension";
import createGenerateChartData from "./createGenerateChartData";

const DEFAULT_MODE = "counts";

const RevocationsByDistrict = observer(
  function RevocationsByDistrict({ containerHeight, timeDescription }, ref) {
    const dataStore = useDataStore();
    const { revocationsChartStore } = dataStore;
    const { districtChartData, currentDistricts } = revocationsChartStore;
    const CHART_TITLE = translate("revocationsByDistrictChartTitle");
    const CHART_ID = translate("revocationsByDistrictChartId");

    const xAxisLabel = translate("District");
    const currentDistrictsClassName = `RevocationsByDimension--${CHART_ID}--${currentDistricts.join(
      "-",
    )}`;

    return (
      <RevocationsByDimension
        ref={ref}
        chartId={CHART_ID}
        className={currentDistrictsClassName}
        dataStore={revocationsChartStore}
        containerHeight={containerHeight}
        renderChart={({
          chartId,
          data,
          denominators,
          numerators,
          averageRate,
          mode,
        }) =>
          mode === "counts" ? (
            <RevocationCountChart
              chartId={chartId}
              data={data}
              xAxisLabel={xAxisLabel}
            />
          ) : (
            <PercentRevokedChart
              data={data}
              chartId={chartId}
              numerators={numerators}
              denominators={denominators}
              averageRate={averageRate}
              xAxisLabel={xAxisLabel}
              yAxisLabel={
                mode === "rates"
                  ? translate("percentOfPopulationRevoked")
                  : "Percent revoked out of all exits"
              }
            />
          )
        }
        generateChartData={createGenerateChartData(
          districtChartData,
          currentDistricts,
        )}
        chartTitle={CHART_TITLE}
        metricTitle={CHART_TITLE}
        timeDescription={timeDescription}
        modes={
          flags.enableRevocationRateByExit
            ? ["counts", "rates", "exits"]
            : ["counts", "rates"]
        }
        defaultMode={DEFAULT_MODE}
        dataExportLabel={xAxisLabel}
      />
    );
  },
  { forwardRef: true },
);

RevocationsByDistrict.defaultProps = { containerHeight: null };

RevocationsByDistrict.propTypes = {
  containerHeight: PropTypes.number,
  timeDescription: PropTypes.string.isRequired,
};

export default RevocationsByDistrict;
