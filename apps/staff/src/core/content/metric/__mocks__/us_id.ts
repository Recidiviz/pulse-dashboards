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

import { StateSpecificMetricCopy } from "../../types";

const content: StateSpecificMetricCopy = {
  projectedPrisonPopulationOverTime: {
    title: "Projected prison populatio over time",
    methodology: "- ID Specific prison population methodology",
  },
  projectedSupervisionPopulationOverTime: {
    methodology: "- ID Specific supervision population methodology",
  },
  supervisionToPrisonOverTime: {
    methodology: "- ID Specific supervision to prison over time methodology",
  },
  supervisionToLibertyOverTime: {
    methodology: "- ID Specific supervision to liberty over time methodology",
  },
};

export default content;
