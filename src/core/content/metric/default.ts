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
    title: "Incarcerated Population",
    note: "Historical and projected population data were generated",
  },
  supervisionPopulationOverTime: {
    title: "Supervised Population",
    note: "Historical and projected population data were generated",
  },
  supervisionToPrisonOverTime: {
    title: "Admissions to prison from supervision",
  },
  supervisionToLibertyOverTime: {
    title: "Releases from supervision to liberty",
  },
  prisonPopulationOverTime: {
    title: "Prison Population Over Time",
  },
  prisonPopulationPersonLevel: {
    title: "List of people in prison",
  },
  prisonFacilityPopulation: {
    title: "Prison population by facility",
  },
};

export default content;
