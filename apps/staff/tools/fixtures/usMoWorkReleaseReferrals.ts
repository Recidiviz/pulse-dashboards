// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { UsMoWorkReleaseReferralRecord } from "~datatypes";

import { externalIdFunc, FirestoreFixture } from "./utils";

const data: UsMoWorkReleaseReferralRecord["input"][] = [
  {
    stateCode: "US_MO",
    externalId: "RES019",
    eligibleCriteria: {
      usMoMentalHealthScore3OrBelowWhileIncarcerated: {},
      usMoInstitutionalRiskScore1WhileIncarcerated: {},
      usMoMeetsTimeRemainingRequirementsWorkRelease: {},
      usMoNoEscapeIn10YearsOrCurrentSentence: {},
      noContrabandIncarcerationIncidentWithin2Years: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      historyEscapesAbsconsions: [
        { eventDate: "2017-08-12", eventType: "ABSCONSION (SUPERVISION)" },
      ],
      historyViolationsLast24Months: [
        { violationCode: "D1-02", violationDate: "2024-09-01" },
      ],
    },
    metadata: {
      currentC3Sanctions: [],
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  },
  {
    stateCode: "US_MO",
    externalId: "RES020",
    eligibleCriteria: {
      usMoMentalHealthScore3OrBelowWhileIncarcerated: {},
      usMoInstitutionalRiskScore1WhileIncarcerated: {},
      usMoMeetsTimeRemainingRequirementsWorkRelease: {},
      usMoNoEscapeIn10YearsOrCurrentSentence: {},
      noContrabandIncarcerationIncidentWithin2Years: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      historyEscapesAbsconsions: [],
      historyViolationsLast24Months: [
        { violationCode: "D1-02", violationDate: "2024-09-01" },
      ],
    },
    metadata: {
      currentC3Sanctions: [],
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  },
];

export const usMoWorkReleaseReferrals: FirestoreFixture<
  UsMoWorkReleaseReferralRecord["input"]
> = {
  data,
  idFunc: externalIdFunc,
};
