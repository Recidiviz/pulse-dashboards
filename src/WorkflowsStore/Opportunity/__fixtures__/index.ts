// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { Required as RequireKeys } from "utility-types";

import {
  ClientRecord,
  CompliantReportingEligibleRecord,
} from "../../../firestore";
import { dateToTimestamp } from "../../utils";

export const compliantReportingEligibleClientRecord: RequireKeys<
  ClientRecord,
  "compliantReportingEligible"
> = {
  personName: { givenNames: "Test", surname: "Name" },
  personExternalId: "cr-eligible-1",
  pseudonymizedId: "pseudo-cr-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "STANDARD: MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditionsFlag: "current",
  lastSpecialConditionsNote: "2022-03-15",
  specialConditions: [],
  compliantReportingEligible: {
    eligibilityCategory: "c1",
    remainingCriteriaNeeded: 0,
    mostRecentArrestCheck: dateToTimestamp("2022-05-28"),
    eligibleLevelStart: dateToTimestamp("2019-12-20"),
    judicialDistrict: "A",
    finesFeesEligible: "regular_payments",
    drugScreensPastYear: [
      { result: "DRUN", date: dateToTimestamp("2022-01-04") },
    ],
    sanctionsPastYear: [],
    currentOffenses: ["EXAMPLE CURRENT"],
    pastOffenses: [],
    lifetimeOffensesExpired: ["EXAMPLE EXPIRED"],
  },
};

export const compliantReportingAlmostEligibleClientRecord: RequireKeys<
  ClientRecord,
  "compliantReportingEligible"
> = {
  personName: { givenNames: "Test", surname: "Name" },
  personExternalId: "cr-almost-eligible-1",
  pseudonymizedId: "pseudo-cr-almost-eligible-1",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "STANDARD: MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  currentBalance: 221.88,
  specialConditionsFlag: "current",
  lastSpecialConditionsNote: "2022-03-15",
  specialConditions: [],
  compliantReportingEligible: {
    eligibilityCategory: "c1",
    remainingCriteriaNeeded: 1,
    mostRecentArrestCheck: dateToTimestamp("2022-05-28"),
    eligibleLevelStart: dateToTimestamp("2019-12-20"),
    judicialDistrict: "A",
    finesFeesEligible: "regular_payments",
    drugScreensPastYear: [],
    sanctionsPastYear: [],
    currentOffenses: ["EXAMPLE CURRENT"],
    pastOffenses: [],
    lifetimeOffensesExpired: ["EXAMPLE EXPIRED"],
  },
};

export const CompliantReportingAlmostEligibleCriteria: Required<
  NonNullable<CompliantReportingEligibleRecord["almostEligibleCriteria"]>
> = {
  passedDrugScreenNeeded: true,
  paymentNeeded: true,
  currentLevelEligibilityDate: "2022-08-15",
  seriousSanctionsEligibilityDate: "2022-08-15",
  recentRejectionCodes: ["TEST1"],
};
