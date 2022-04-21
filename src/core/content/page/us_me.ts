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
    methodology:
      "These charts include individuals who are admitted to Maine state prison facilities. People on SCCP and in County Jails are not included.",
  },
  supervision: {
    sections: {
      countOverTime: "Supervision population over time",
      countByLocation: "Supervision population by sub-office",
      countBySupervisionLevel: "Supervision population by risk level",
    },
    methodology:
      'Note: Risk level charts and filters on this page combine "High" and "Very High" risk levels into "High."',
  },
  supervisionToPrison: {
    sections: {
      countOverTime: "Admissions from supervision over time",
      countByLengthOfStay: "Length of stay on supervision before admission",
      countByLocation: "Admissions from supervision by sub-office",
      countByGender: "Admissions from supervision by gender ",
      countByRace: "Admissions from supervision by race",
      countBySupervisionLevel: "Admissions from supervision by risk level",
      countByMostSevereViolation:
        "Admissions from supervision by most severe violation",
      countByNumberOfViolations:
        "Admissions from supervision by number of violations",
      countByOfficer: "Admissions from supervision by officer",
    },
    methodology:
      'Note: Risk level charts and filters on this page combine "High" and "Very High" risk levels into "High."',
  },
  supervisionToLiberty: {
    sections: {
      countOverTime: "Releases from supervision over time",
      countByLengthOfStay: "Length of stay on supervision before release",
      countByLocation: "Releases from supervision by sub-office",
      countByRace: "Releases from supervision by race",
      countByGender: "Releases from supervision by gender ",
      countByAgeGroup: "Releases from supervision by age",
    },
  },
};

export default content;
