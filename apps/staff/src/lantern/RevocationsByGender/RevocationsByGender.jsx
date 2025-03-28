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

import { useRootStore } from "../../components/StoreProvider";
import { US_PA } from "../../RootStore/TenantStore/lanternTenants";
import { genderValueToLabel } from "../../utils/formatStrings";
import { translate } from "../../utils/i18nSettings";
import HorizontalBarChartWithLabels from "../BarCharts/HorizontalBarChartWithLabels";
import { useDataStore } from "../LanternStoreProvider";
import RevocationsByDimension from "../RevocationsByDimension";
import createGenerateChartData from "./createGenerateChartData";

const DEFAULT_MODE = "MALE";

const RevocationsByGender = observer(
  function RevocationsByGender({ containerHeight, timeDescription }, ref) {
    const { currentTenantId } = useRootStore();
    const { revocationsChartStore } = useDataStore();
    const CHART_TITLE = translate("revocationsByGenderChartTitle");
    const CHART_ID = translate("revocationsByGenderChartId");
    const stacked = currentTenantId === US_PA;

    return (
      <RevocationsByDimension
        ref={ref}
        chartId={CHART_ID}
        dataStore={revocationsChartStore}
        containerHeight={containerHeight}
        renderChart={({ chartId, data, denominators, numerators }) => (
          <HorizontalBarChartWithLabels
            id={chartId}
            data={data}
            numerators={numerators}
            denominators={denominators}
            stacked={stacked}
          />
        )}
        generateChartData={createGenerateChartData(
          revocationsChartStore,
          stacked,
        )}
        chartTitle={CHART_TITLE}
        metricTitle={
          stacked ? CHART_TITLE : (mode) => `${CHART_TITLE}: ${mode}`
        }
        timeDescription={timeDescription}
        modes={stacked ? [] : Object.keys(genderValueToLabel)}
        defaultMode={DEFAULT_MODE}
        dataExportLabel="Gender"
      />
    );
  },
  { forwardRef: true },
);

RevocationsByGender.defaultProps = { containerHeight: null };

RevocationsByGender.propTypes = {
  containerHeight: PropTypes.number,
  timeDescription: PropTypes.string.isRequired,
};

export default RevocationsByGender;
