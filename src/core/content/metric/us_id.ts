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
      "- The monthly figures shown in the chart represent the total population for the selected group on the first day of that month. For example, if you hover over the “November 2020” data point on the chart, you’ll see the total number of people in prison on November 1, 2020.\n- Something about prediction intervals being 95%.\n- To see detailed methodology on how projections are calculated, download this PDF.",
  },
  supervisionPopulationOverTime: {
    methodology:
      "- The monthly figures shown in the chart represent the total population for the selected group on the first day of that month. For example, if you hover over the “November 2020” data point on the chart, you’ll see the total number of people in prison on November 1, 2020.\n- Something about prediction intervals being 95%.\n- To see detailed methodology on how projections work, download this PDF.",
  },
  supervisionToPrisonOverTime: {
    methodology: "- supervision to prison over time methodology",
  },
  supervisionToLibertyOverTime: {
    methodology: "- supervision to liberty over time methodology",
  },
};

export default content;
