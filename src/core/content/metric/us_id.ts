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
    title: "Prison Population",
    methodology:
      "- **Historical population:** The left side of the chart describes the historical prison population over the selected “Time Period”. Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the “November 2020” data point on the chart will show the total number of people described in the “Who is included?” section above on November 1, 2020. \n- **Projected population:** The right side of the chart describes the projected prison population over the selected “Time Period.” The shaded area represents the confidence intervals of the projection. On hover, the 5% and 95% confidence range can be seen in parentheses. Click here for more on the projection methodology.",
  },
  supervisionPopulationOverTime: {
    title: "Supervision Population",
    methodology:
      "- **Historical population:** The left side of the chart describes the historical supervision population over the selected “Time Period”. Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the “November 2020” data point on the chart will show the total number of people described in the “Who is included?” section above on November 1, 2020. \n- **Projected population:** The right side of the chart describes the projected supervision population over the selected “Time Period.” The shaded area represents the confidence intervals of the projection. On hover, the 5% and 95% confidence range can be seen in parentheses. Click here for more on the projection methodology.",
  },
  supervisionToPrisonOverTime: {
    title: "Admissions from Supervision to Prison",
    methodology:
      "- **Number of admissions:** Each data point represents the total number of admissions from supervision to prison over the course of the month. For example, hovering over the “November 2020” bar in the chart will show the total number of admissions between November 1 and November 30, 2020. \n- **90-day rolling average:** Each data point on the solid line represents the average number of admissions for each of the past 90 days.",
  },
  supervisionToLibertyOverTime: {
    title: "Releases from Supervision to Liberty",
    methodology:
      "- **Number of releases:** Each data point represents the total number of releases from supervision to liberty over the course of the month. For example, hovering over the “November 2020” bar in the chart will show the total number of releases between November 1 and November 30, 2020. \n- **90-day rolling average:** Each data point on the solid line represents the average number of releases for each of the past 90 days.",
  },
};

export default content;
