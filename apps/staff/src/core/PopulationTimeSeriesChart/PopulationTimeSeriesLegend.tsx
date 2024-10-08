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

import "./PopulationTimeSeriesLegend.scss";

import React from "react";

type propTypes = {
  items: string[];
};

const PopulationTimeSeriesLegend: React.FC<propTypes> = ({ items }) => {
  return (
    <div className="PopulationTimeSeriesLegend">
      {items.map((label) => (
        <div className="PopulationTimeSeriesLegend__item" key={label}>
          <div
            className={`PopulationTimeSeriesLegend__icon ${label.split(
              " ",
              1,
            )}Legend`}
          >
            <svg height="2" width="24">
              <line
                x1="0"
                y1="0"
                x2="24"
                y2="0"
                className="PopulationTimeSeriesLegend__line"
              />
            </svg>
          </div>
          <div className="PopulationTimeSeriesLegend__text">{label}</div>
        </div>
      ))}
    </div>
  );
};

export default PopulationTimeSeriesLegend;
