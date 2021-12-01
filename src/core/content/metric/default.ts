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

import { MetricCopy } from "../types";

const content: MetricCopy = {
  projectedPrisonPopulationOverTime: {
    title: "Prison population over time",
    note: "Historical and projected population data were generated",
  },
  supervisionPopulationOverTime: {
    title: "Supervision population over time",
    note: "Historical and projected population data were generated",
  },
  supervisionToPrisonOverTime: {
    title: "Admissions from supervision over time",
    methodology:
      "The chart describes the number of people admitted from supervision to prison.",
  },
  supervisionToLibertyOverTime: {
    title: "Releases from supervision over time",
  },
  prisonPopulationOverTime: {
    title: "Prison population over time",
  },
  prisonPopulationPersonLevel: {
    title: "List of people in prison",
  },
  prisonFacilityPopulation: {
    title: "Prison population by facility",
  },
  supervisionToPrisonPopulationByDistrict: {
    title: "Admissions from supervision by district",
  },
};

export default content;
