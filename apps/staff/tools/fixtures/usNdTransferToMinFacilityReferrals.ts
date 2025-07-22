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

import { OpportunityRecordBase, relativeFixtureDate } from "~datatypes";

import { externalIdFunc, FirestoreFixture } from "./utils";

const data: OpportunityRecordBase[] = [
  // Eligible record
  {
    stateCode: "US_ND",
    externalId: "ND_RES003",
    eligibleCriteria: {
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
        custodyLevelStartDate: relativeFixtureDate({ months: -1 }),
      },
      usNdNotInMinimumSecurityFacility: {},
      notInWorkRelease: {},
      usNdNotInAnOrientationUnit: {},
      usNdNotInWtruBtc: {},
      incarcerationWithin42MonthsOfFullTermCompletionDate: {
        fullTermCompletionDate: relativeFixtureDate({ years: 2, months: 9 }),
      },
      notIncarcerationWithin3MonthsOfFullTermCompletionDate: {
        fullTermCompletionDate: relativeFixtureDate({ years: 2, months: 9 }),
      },
      usNdNotEnrolledInRelevantProgram: {},
      noEscapeInCurrentIncarceration: {},
      notHousingUnitTypeIsSolitaryConfinement: {},
      usNdNoDetainersOrFelonyWarrants: {},
      usNdNoRecentReferralsToMinimumHousing: {},
    },
    ineligibleCriteria: {},
    metadata: {},
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  },
  // Referral submitted record
  {
    stateCode: "US_ND",
    externalId: "ND_RES004",
    eligibleCriteria: {
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
        custodyLevelStartDate: relativeFixtureDate({ days: -7 }),
      },
      usNdNotInMinimumSecurityFacility: {},
      notInWorkRelease: {},
      usNdNotInAnOrientationUnit: {},
      usNdNotInWtruBtc: {},
      incarcerationWithin42MonthsOfFullTermCompletionDate: {
        fullTermCompletionDate: relativeFixtureDate({ years: 3, months: 1 }),
      },
      notIncarcerationWithin3MonthsOfFullTermCompletionDate: {
        fullTermCompletionDate: relativeFixtureDate({ years: 3, months: 1 }),
      },
      usNdNotEnrolledInRelevantProgram: {},
      noEscapeInCurrentIncarceration: {},
      notHousingUnitTypeIsSolitaryConfinement: {},
      usNdNoDetainersOrFelonyWarrants: {},
      usNdNoRecentReferralsToMinimumHousing: {},
    },
    ineligibleCriteria: {},
    metadata: {
      tabName: "REFERRAL_SUBMITTED",
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: true,
  },
  // Almost eligible record (enrolled in program)
  {
    stateCode: "US_ND",
    externalId: "ND_RES005",
    eligibleCriteria: {
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
        custodyLevelStartDate: relativeFixtureDate({ months: -2 }),
      },
      usNdNotInMinimumSecurityFacility: {},
      notInWorkRelease: {},
      usNdNotInAnOrientationUnit: {},
      usNdNotInWtruBtc: {},
      incarcerationWithin42MonthsOfFullTermCompletionDate: {
        fullTermCompletionDate: relativeFixtureDate({ years: 1, months: 2 }),
      },
      notIncarcerationWithin3MonthsOfFullTermCompletionDate: {
        fullTermCompletionDate: relativeFixtureDate({ years: 1, months: 2 }),
      },
      noEscapeInCurrentIncarceration: {},
      notHousingUnitTypeIsSolitaryConfinement: {},
      usNdNoDetainersOrFelonyWarrants: {},
      usNdNoRecentReferralsToMinimumHousing: {},
    },
    ineligibleCriteria: {
      usNdNotEnrolledInRelevantProgram: {
        programDescriptions:
          "JRCC - SO-SEX OFFENDER TREATMENT PROGRAM@@SO-SEX OFFENDER TREATMENT PROGRAM",
        programStatuses: "IN_PROGRESS",
      },
    },
    metadata: {},
    caseNotes: {},
    isEligible: false,
    isAlmostEligible: true,
  },
];

export const usNdTransferToMinFacilityReferrals: FirestoreFixture<OpportunityRecordBase> =
  {
    data,
    idFunc: externalIdFunc,
  };
