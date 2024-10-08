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

import "./PathwaysTooltip.scss";

import React from "react";

type PropTypes = {
  label: string;
  value: string;
  average?: string;
};

const PathwaysTooltip: React.FC<PropTypes> = ({ label, value, average }) => {
  return (
    <div className="PathwaysTooltip">
      <div className="PathwaysTooltip__label">{label}</div>
      <div className="PathwaysTooltip__value">{value.toLocaleString()}</div>
      <div className="PathwaysTooltip__average">{average}</div>
    </div>
  );
};

export default PathwaysTooltip;
