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

import { MetricCopy } from "../../types";

const content: MetricCopy = {
  prisonPopulationPersonLevel: {
    title: "List of people in prison",
  },
  prisonFacilityPopulation: {
    title: "Incarcerated Population by Prison",
    note: "Incarcerated population by prison note",
    methodology: "Incarcerated population by prison methodology",
  },
  prisonPopulationOverTime: {
    title: "Incarcerated Population",
    note: "Incarcerated population note",
    methodology: "Incarcerated population methodology",
  },
  projectedPrisonPopulationOverTime: {
    title: "Incarcerated Population",
    note: "Incarcerated population note",
    methodology: "Incarcerated population methodology",
  },
  projectedSupervisionPopulationOverTime: {
    title: "Supervised Population",
    note: "Supervised population note",
    methodology: "Supervised population methodology",
  },
  supervisionToPrisonOverTime: {
    title: "Admissions to prison from supervision",
    note: "Admissions to prison from supervision note",
    methodology: "Admissions to prison from supervision methodology",
  },
  supervisionToPrisonPopulationByDistrict: {
    title: "Admissions from supervision by district",
    note: "Admissions from supervision by district note",
    methodology: "Admissions from supervision by district methodology",
  },
  supervisionToLibertyOverTime: {
    title: "Releases to from supervision to liberty",
    note: "Releases to from supervision to liberty note",
    methodology: "Releases to from supervision to liberty methodology",
  },
};

export default content;
