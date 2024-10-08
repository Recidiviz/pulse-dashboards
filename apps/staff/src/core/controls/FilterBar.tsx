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

import "./FilterBar.scss";

import React from "react";
import Sticky from "react-sticky-fill";

const FILTER_BAR_STYLE = {
  top: 64,
};

const FilterBar: React.FC<{
  details?: React.ReactElement;
  children: React.ReactNode;
  containerRef?: any;
  filtersRef?: any;
}> = ({ details = null, children, containerRef, filtersRef }) => {
  return (
    <Sticky style={FILTER_BAR_STYLE} className="Sticky">
      <div className="FilterBar">
        <div className="FilterBar__container" ref={containerRef}>
          <div className="FilterBar__filters" ref={filtersRef}>
            {children}
          </div>
          {details && details}
        </div>
      </div>
    </Sticky>
  );
};

export default FilterBar;
