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

import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

const BubbleTableCell: React.FC<{ value: number }> = ({ value }) => (
  <span
    key={value}
    className={cx("VitalsSummaryTable__bubble", {
      "VitalsSummaryTable__bubble--70": value < 70,
      "VitalsSummaryTable__bubble--80": value >= 70 && value < 80,
      "VitalsSummaryTable__bubble--90": value >= 80 && value < 90,
      "VitalsSummaryTable__bubble--100": value >= 90,
    })}
  >
    {value}%
  </span>
);

BubbleTableCell.propTypes = {
  value: PropTypes.number.isRequired,
};

export default BubbleTableCell;
