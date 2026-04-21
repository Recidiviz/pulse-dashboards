// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { PageCopy } from "../types";

const content: PageCopy = {
  libertyToPrison: {
    title: "Liberty to Prison",
    summary:
      "Includes people who were sentenced to prison from a new court commitment.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "Judicial District",
      countBySex: "Sex",
      countByAgeGroup: "Age",
      countByRace: "Race",
      countByPriorLengthOfIncarceration: "Prior Incarceration",
    },
  },
  prison: {
    title: "Prison",
    summary: "This page shows all people in state prison facilities.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "Facility",
      countByRace: "Race",
      countBySex: "Sex",
      countByAgeGroup: "Age",
      personLevelDetail: "People",
    },
    methodology: "Includes individuals who are admitted to state facilities.",
  },
  prisonToSupervision: {
    title: "Prison to Supervision",
    summary:
      "Includes people who were released from state prison facilities to supervision.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "Facility",
      countByAgeGroup: "Age",
      countByRace: "Race",
      personLevelDetail: "People",
    },
  },
  supervision: {
    title: "Supervision",
    summary: "Includes all people supervised by the state.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "District",
      countBySupervisionLevel: "Supervision Level",
      countByRace: "Race",
    },
  },
  supervisionToPrison: {
    title: "Supervision to Prison",
    summary:
      "Includes people who have been incarcerated in a state facility because their parole or probation was revoked. Revocations are counted when the person was admitted to a facility, not when the violation occurred.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "District",
      countByLengthOfStay: "Length of Stay",
      countBySex: "Sex",
      countByRace: "Race",
      countBySupervisionLevel: "Supervision Level",
      countByMostSevereViolation: "Most Severe Violation",
      countByNumberOfViolations: "Number of Violations",
      countByOfficer: "Officer",
    },
    methodology:
      "These charts include details of all admissions from supervision to prison.",
  },
  supervisionToLiberty: {
    title: "Supervision to Liberty",
    summary:
      "Includes people who were discharged from supervision positively or if their supervision period expired.",
    sections: {
      countOverTime: "Overview",
      countByLengthOfStay: "Length of Stay",
      countByLocation: "District",
      countByRace: "Race",
      countBySex: "Sex",
      countByAgeGroup: "Age",
    },
    methodology:
      "These charts include events where people are released from supervision to liberty. Releases are counted on the day a person terminates supervision. All charts on this page are event-based, so if a single person has two releases during the selected time period, two events are counted on this page.",
  },
};

export default content;
