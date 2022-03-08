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

import { StateSpecificPageCopy } from "../types";

const content: StateSpecificPageCopy = {
  prison: {
    summary:
      "These charts include individuals who are admitted to state facilities, including termers, riders, parole violators, people in CAPP, and people held in county jails under state jurisdiction.",
    sections: {
      projectedCountOverTime: "Prison population over time",
      countByLocation: "Prison population by facility",
      personLevelDetail: "List of people in prison",
    },
    methodology:
      "These charts include individuals who are admitted to state facilities, including termers, riders, parole violators, people in CAPP, and people held in county jails under state jurisdiction.\n\nFor people held in paid county jail beds, the historical total incarcerated population uses the movements file to exclude people who have entered County Jails in unpaid beds. Currently, any movement period listed with the fac_cd + lu_cd code in the list ‘RTSX’, ‘RTUT’, ‘CJVS’, ‘CJCT’ is not counted until a subsequent movement is recorded without any of those codes. ",
  },
  supervision: {
    summary:
      "These charts include all people on probation, parole/dual supervision, informal probation, those who have absconded, and those who have an active bench warrant.",
    sections: {
      projectedCountOverTime: "Supervision population over time",
      countByLocation: "Supervision population by district",
      countBySupervisionLevel: "Supervision population by supervision level",
    },
    methodology:
      "These charts include all people on probation, parole/dual supervision, informal probation, those who have absconded, and those who have an active bench warrant.",
  },
  prisonToSupervision: {
    sections: {
      countOverTime: "Releases from prison to supervision over time",
      countByAgeGroup: "Releases to supervision by age",
      countByLocation: "Releases to supervision by facility",
    },
  },
  supervisionToPrison: {
    summary:
      "These charts include a count of all admissions from supervision to prison. People on supervision include those on probation, parole/dual supervision, informal probation, those who have absconded, and those who have an active bench warrant. An admission is counted on the day the person is admitted to a facility, not the day the violation occurred.\n",
    sections: {
      countByLocation: "Admissions from supervision by district",
      countByMostSevereViolation:
        "Admissions from supervision by most severe violation",
      countByNumberOfViolations:
        "Admissions from supervision by number of violations",
      countByLengthOfStay: "Time to admission from supervision",
      countBySupervisionLevel:
        "Admissions from supervision to prison by supervision level",
    },
    methodology:
      "These charts include a count of all admissions supervision to prison. People on supervision include those on probation, parole/dual supervision, informal probation, those who have absconded, and those who have an active bench warrant. An admission is counted on the day the person is admitted to a facility, not the day the violation occurred.\n",
  },
  supervisionToLiberty: {
    summary:
      "These charts include a count of all releases from supervision to liberty. A release is defined as a discharge, expiration, commutation, or pardon.",
    methodology:
      "These charts include a count of all releases from supervision to liberty. A release is defined as a discharge, expiration, commutation, or pardon.",
  },
};

export default content;
