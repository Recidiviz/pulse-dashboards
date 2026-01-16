// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { StateSpecificMetricCopy } from "../types";

const content: StateSpecificMetricCopy = {
  prisonPopulationOverTime: {
    title: "Prison population over time",
    note: "Data labelled May 1, 2024 was actually generated May 4, 2024.",
    methodology:
      'The chart describes the historical incarceration population over the selected "Time Period". Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the "November 2020" data point on the chart will show the total number of people described in the section above on November 1, 2020. \n- Please note that data labelled May 1, 2024 was actually generated May 4, 2024.',
  },
  prisonPopulationBySex: {
    title: "Prison population by sex",
    methodology:
      "The chart describes the number of people from each sex as of the date specified in the chart title. ",
  },
  prisonPopulationByGender: {
    title: "Prison population by gender identity",
    methodology:
      "The chart describes the number of people from each gender identity as of the date specified in the chart title. ",
  },
};

export default content;
