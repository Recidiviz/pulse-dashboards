/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
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

import { StateSpecificPageCopy } from "../types";

const content: StateSpecificPageCopy = {
  prison: {
    summary:
      'Includes individuals who are admitted to state facilities, including termers, riders, parole violators, people in CAPP, and people held in county jails. All people in work centers are grouped into a "WC" category.\n',
    sections: {
      projectedCountOverTime: "Prison population over time",
      countByLocation: "Prison population by facility",
      personLevelDetail: "List of people in prison",
    },
    methodology:
      'Includes individuals who are admitted to state facilities, including termers, riders, parole violators, people in CAPP, and people held in county jails. All people in work centers are grouped into a "WC" category.\n',
  },
  supervision: {
    summary:
      "Includes all people on probation, parole/dual supervision, informal probation, those who have absconded, and those who have an active bench warrant.",
    sections: {
      projectedCountOverTime: "Supervision population over time",
      countByLocation: "Supervision population by district",
      countBySupervisionLevel: "Supervision population by supervision level",
    },
    methodology:
      "Includes all people on probation, parole/dual supervision, informal probation, those who have absconded, and those who have an active bench warrant.",
  },
  supervisionToPrison: {
    summary:
      "Includes a count of all admissions supervision to prison. People on supervision include those on probation, parole/dual supervision, informal probation, those who have absconded, and those who have an active bench warrant. An admission is counted on the day the person is admitted to a facility, not the day the violation occurred.\n",
    methodology:
      "Includes a count of all admissions supervision to prison. People on supervision include those on probation, parole/dual supervision, informal probation, those who have absconded, and those who have an active bench warrant. An admission is counted on the day the person is admitted to a facility, not the day the violation occurred.\n",
  },
  supervisionToLiberty: {
    summary:
      "Includes a count of all releases from supervision to liberty. A release is defined as a discharge, expiration, commutation, or pardon.",
    methodology:
      "Includes a count of all releases from supervision to liberty. A release is defined as a discharge, expiration, commutation, or pardon.",
  },
};

export default content;
