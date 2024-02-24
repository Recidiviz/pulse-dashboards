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

import "./ImpactTooltip.scss";

import React from "react";

type PropTypes = {
  d: {
    months: number;
    value: number;
  };
};

const ImpactToolTip: React.FC<PropTypes> = ({ d }) => {
  const { months, value } = d;

  const monthsTooltip = `${months.toLocaleString()} month`;

  return (
    <div className="ImpactToolTip">
      <div className="ImpactToolTip__months">{monthsTooltip}</div>
      <div className="ImpactToolTip__value">{value.toLocaleString()}</div>
    </div>
  );
};

export default ImpactToolTip;
