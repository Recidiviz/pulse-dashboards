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

const stateCodes = {
  US_AR: "US_AR",
  US_CA: "US_CA",
  US_CO: "US_CO",
  US_ID: "US_ID",
  US_ME: "US_ME",
  US_MI: "US_MI",
  US_MO: "US_MO",
  US_NC: "US_NC",
  US_ND: "US_ND",
  US_OR: "US_OR",
  US_PA: "US_PA",
  US_TN: "US_TN",
};

const csgStateCodes = [
  stateCodes.US_MO,
  stateCodes.US_PA,
  stateCodes.US_MI,
  stateCodes.US_TN,
];

module.exports = {
  stateCodes,
  csgStateCodes,
};
