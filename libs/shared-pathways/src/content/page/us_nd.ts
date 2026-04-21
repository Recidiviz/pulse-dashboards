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

import { StateSpecificPageCopy } from "../types";

const content: StateSpecificPageCopy = {
  prison: {
    title: "Incarceration",
    summary:
      "These charts show people incarcerated in an ND DOCR facility or serving their prison sentence in the community through the Community Placement Program. It does not include individuals incarcerated in county jails.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "Facility",
      countByRace: "Race",
      personLevelDetail: "People",
    },
    methodology:
      "These charts show people incarcerated in a ND DOCR facility or serving their prison sentence in the community through the Community Placement Program. It does not include individuals incarcerated in county jails unless the individual is temporarily transferred to a county jail while already incarcerated.",
  },
  supervisionToPrison: {
    title: "Supervision to Incarceration",
    summary:
      "These charts include events where people are admitted from supervision to incarceration. This includes revocations, sanction admissions, and new court commits that occur while an individual is on supervision. Admissions are counted when the person was admitted to incarceration status. All charts on this page are event-based, so if a single person has two admissions during the selected time period, two events are counted on this page.",
    methodology:
      "These charts include events where people are admitted from supervision to incarceration. This includes revocations, sanction admissions, and new court commits that occur while an individual is on supervision. Admissions are counted when the person was admitted to incarceration status. All charts on this page are event-based, so if a single person has two admissions during the selected time period, two events are counted on this page.",
  },
  libertyToPrison: {
    title: "Liberty to Incarceration",
    summary:
      "These charts include events where people are admitted to incarceration status from a new court commitment. Admissions are counted when the person was admitted to incarceration. All charts on this page are event-based, so if a single person has two admissions during the selected time period, two events are counted on this page.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "District",
      countBySex: "Sex",
      countByAgeGroup: "Age",
      countByRace: "Race",
      countByPriorLengthOfIncarceration: "Prior Incarceration",
    },
    methodology:
      "These charts include events where people are admitted to incarceration status from a new court commitment. Admissions are counted when the person was admitted to incarceration. All charts on this page are event-based, so if a single person has two admissions during the selected time period, two events are counted on this page.",
  },
  prisonToSupervision: {
    title: "Incarceration to Supervision",
    summary:
      "These charts include events where people are released from incarceration to supervision. Releases are counted on the day a person leaves incarceration. All charts on this page are event-based, so if a single person has two releases during the selected time period, two events are counted on this page.",
    sections: {
      countOverTime: "Overview",
      countByLocation: "Facility",
      countByAgeGroup: "Age",
      countByRace: "Race",
      personLevelDetail: "People",
    },
    methodology:
      "These charts include events where people are released from incarceration to supervision. Releases are counted on the day a person leaves incarceration. All charts on this page are event-based, so if a single person has two releases during the selected time period, two events are counted on this page.",
  },
  supervision: {
    title: "Supervision",
    summary:
      "These charts show people supervised by ND DOCR or serving their prison sentence in the community through the Community Placement Program. The parole population includes people who are interstate compact.",
    methodology:
      "These charts show people supervised by ND DOCR or serving their prison sentence in the community through the Community Placement Program. The parole population includes people who are interstate compact.",
  },
  supervisionToLiberty: {
    title: "Supervision to Liberty",
    summary:
      "These charts include events where people are released from supervision to liberty. Releases are counted on the day a person terminates supervision. All charts on this page are event-based, so if a single person has two releases during the selected time period, two events are counted on this page.",
    methodology:
      "These charts include events where people are released from supervision to liberty. Releases are counted on the day a person terminates supervision. All charts on this page are event-based, so if a single person has two releases during the selected time period, two events are counted on this page.",
  },
};

export default content;
