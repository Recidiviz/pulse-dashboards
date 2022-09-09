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
import PropTypes from "prop-types";
import Loading from "../components/Loading";

const LoadingChart = ({ containerHeight }) => {
  const loadingContainerStyles =
    containerHeight > 0
      ? {
          height: `${containerHeight}px`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }
      : {};

  return (
    <div className="LoadingChart" style={loadingContainerStyles}>
      <Loading />
    </div>
  );
};

LoadingChart.defaultProps = { containerHeight: null };

LoadingChart.propTypes = {
  containerHeight: PropTypes.number,
};

export default LoadingChart;
