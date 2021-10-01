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
  prisonPopulationOverTime: {
    title: "Incarcerated Population",
    note: "Historical and projected population data were generated",
    methodology:
      "This is the supervision to prison over time specific methodology",
  },
  supervisionPopulationOverTime: {
    title: "Supervised Population",
    note: "Historical and projected population data were generated",
  },
  supervisionToPrisonOverTime: {
    title: "Admissions to prison from supervision",
    note:
      "The revocation rate is calculated by counting the number of revocations per month and dividing it by the total supervision population in the given month or year. In this chart, the total supervision population includes only those on in-state probation, parole, or dual supervision. ",
  },
  supervisionToLibertyOverTime: {
    title: "Releases to from supervision to liberty",
    note:
      "The supervision success rate is calculated by counting the number of supervision terms ending in release per month and dividing it by the total number of supervision sessions terminating in a given month. For parole periods, this means when the parole period terminates in release to liberty or ultimate revocation, not when it terminates with a parole board hold. Individuals on dual supervision are counted under parole. ",
  },
};

export default content;
