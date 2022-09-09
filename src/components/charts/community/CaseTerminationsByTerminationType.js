// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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
import PropTypes from "prop-types";

import PerMonthBarChart from "../common/bars/PerMonthBarChart";
import { COLORS_SEVEN_VALUES } from "../../../assets/scripts/constants/colors";

const chartId = "caseTerminationsByTerminationType";

const CaseTerminationsByTerminationType = ({
  caseTerminationCountsByMonthByTerminationType,
  metricType,
  metricPeriodMonths,
  supervisionType,
  district,
}) => (
  <PerMonthBarChart
    chartId={chartId}
    exportLabel="Case termination counts by termination type"
    countsByMonth={caseTerminationCountsByMonthByTerminationType}
    metricType={metricType}
    numMonths={metricPeriodMonths}
    filters={{
      district,
      supervisionType,
    }}
    bars={[
      { key: "absconsion", label: "Absconsion" },
      { key: "revocation", label: "Revocation" },
      { key: "suspension", label: "Suspension" },
      { key: "discharge", label: "Discharge" },
      { key: "expiration", label: "Expiration" },
      { key: "death", label: "Death" },
      { key: "other", label: "Other" },
    ]}
    yAxisLabel={metricType === "counts" ? "Case terminations" : "Percentage"}
    barColorPalette={COLORS_SEVEN_VALUES}
  />
);

CaseTerminationsByTerminationType.defaultProps = {
  caseTerminationCountsByMonthByTerminationType: [],
};

CaseTerminationsByTerminationType.propTypes = {
  metricType: PropTypes.string.isRequired,
  metricPeriodMonths: PropTypes.string.isRequired,
  district: PropTypes.arrayOf(PropTypes.string).isRequired,
  caseTerminationCountsByMonthByTerminationType: PropTypes.arrayOf(
    PropTypes.shape({})
  ),
  supervisionType: PropTypes.string.isRequired,
};

export default CaseTerminationsByTerminationType;
