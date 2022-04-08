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

import { PageCopy } from "../types";

const content: PageCopy = {
  libertyToPrison: {
    title: "Liberty to Prison",
    summary:
      "Includes people who were sentenced to prison from a new court commitment.",
    sections: {
      countOverTime: "Admissions from liberty to prison over time",
      countByLocation: "Admissions from liberty to prison by judicial district",
      countByGender: "Admissions from liberty to prison by gender",
      countByAgeGroup: "Admissions from liberty to prison by age",
      countByRace: "Admissions from liberty to prison by race",
      countByPriorLengthOfIncarceration:
        "Admissions from liberty to prison by prior length of incarceration",
    },
  },
  prison: {
    title: "Prison",
    summary: "This page shows all people in state prison facilities.",
    sections: {
      countOverTime: "Prison population over time",
      countByLocation: "Prison population by facility",
      personLevelDetail: "List of people in prison",
    },
    methodology: "Includes individuals who are admitted to state facilities.",
  },
  prisonToSupervision: {
    title: "Prison to Supervision",
    summary:
      "Includes people who were released from state prison facilities to supervision.",
    sections: {
      countOverTime: "Releases from prison to supervision over time",
      countByLocation: "Releases from prison to supervision by facility",
      countByAgeGroup: "Releases from prison to supervision by age",
      personLevelDetail: "List of releases from prison to supervision",
    },
  },
  supervision: {
    title: "Supervision",
    summary: "Includes all people supervised by the state.",
    sections: {
      countOverTime: "Supervision population over time",
      countByLocation: "Supervision population by district",
      countBySupervisionLevel: "Supervision population by supervision level",
    },
  },
  supervisionToPrison: {
    title: "Supervision to Prison",
    summary:
      "Includes people who have been incarcerated in a state facility because their parole or probation was revoked. Revocations are counted when the person was admitted to a facility, not when the violation occurred.",
    sections: {
      countOverTime: "Admissions from supervision over time",
      countByLocation: "Admissions from supervision by district",
      countByLengthOfStay: "Time to admission from supervision",
      countByGender: "Admissions from supervision by gender ",
      countByRace: "Admissions from supervision by race",
      countBySupervisionLevel:
        "Admissions from supervision by supervision level",
      countByMostSevereViolation:
        "Admissions from supervision by most severe violation",
      countByNumberOfViolations:
        "Admissions from supervision by number of violations",
      countByOfficer: "Admissions from supervision by officer",
    },
    methodology:
      "These charts include details of all admissions from supervision to prison.",
  },
  supervisionToLiberty: {
    title: "Supervision to Liberty",
    summary:
      "Includes people who were discharged from supervision positively or if their supervision period expired.",
    sections: {
      countOverTime: "Releases from supervision over time",
      countByLengthOfStay: "Time served at release",
      countByLocation: "Releases from supervision by district",
      countByRace: "Releases from supervision by race",
      countByGender: "Releases from supervision by gender ",
      countByAgeGroup: "Releases from supervision by age",
    },
    methodology:
      "These charts include events where people are released from supervision to liberty. Releases are counted on the day a person terminates supervision. All charts on this page are event-based, so if a single person has two releases during the selected time period, two events are counted on this page.",
  },
};

export default content;
