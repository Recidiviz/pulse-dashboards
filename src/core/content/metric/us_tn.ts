/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import { StateSpecificMetricCopy } from "../types";

const content: StateSpecificMetricCopy = {
  prisonPopulationOverTime: {
    methodology:
      "The chart describes the historical prison population over the selected “Time Period”. Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the “November 2020” data point on the chart will show the total number of people described in the section above on November 1, 2020. ",
  },
  prisonFacilityPopulation: {
    methodology:
      "The chart describes the number of people in each facility as of the date specified in the chart title. ",
  },
  prisonPopulationPersonLevel: {
    methodology:
      "The table includes a row for each person in prison as of the date specified in the chart title. ",
  },
  supervisionToPrisonPopulationByDistrict: {
    methodology:
      "The chart describes the number of people admitted to prison from each district as of the date specified in the chart title. ",
  },
};

export default content;
