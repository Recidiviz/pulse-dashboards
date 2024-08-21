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

const { stateCodes } = require("../../../constants/stateCodes");
const { US_MO_DIMENSION_VALUES } = require("./us_mo");
const { US_PA_DIMENSION_VALUES } = require("./us_pa");

module.exports = {
  [stateCodes.US_MO]: US_MO_DIMENSION_VALUES,
  [stateCodes.US_PA]: US_PA_DIMENSION_VALUES,
};
