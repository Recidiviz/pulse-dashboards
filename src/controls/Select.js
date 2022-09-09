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
import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import ReactSelect from "react-select";

import styles from "./Select.styles";
import { optionPropType } from "./propTypes";

const Select = forwardRef((props, ref) => (
  <ReactSelect
    ref={ref}
    styles={styles}
    className="Select"
    classNamePrefix="Select"
    {...props}
  />
));

Select.propTypes = {
  value: PropTypes.oneOfType([
    optionPropType,
    PropTypes.arrayOf(optionPropType),
  ]).isRequired,
  defaultValue: PropTypes.oneOfType([
    optionPropType,
    PropTypes.arrayOf(optionPropType),
  ]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(optionPropType).isRequired,
};

Select.displayName = "Select";

export default Select;
