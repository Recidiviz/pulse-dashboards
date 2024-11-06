// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  UsIdExpandedCRCReferralRecordRaw,
  usIdExpandedCRCSchema,
} from "../UsIdExpandedCRCOpportunity";

test("transforms record with FTCD and PED set", () => {
  const rawRecord: UsIdExpandedCRCReferralRecordRaw = {
    stateCode: "US_MI",
    externalId: "xcrc-eligible-01",
    eligibleCriteria: {
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      notServingForSexualOffense: null,
      usIdNoDetainersForXcrcAndCrc: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd: {
        fullTermCompletionDate: "2022-08-12",
        paroleEligibilityDate: "2022-03-19",
        tentativeParoleDate: null,
      },
      usIdInCrcFacilityOrPwccUnit1: {
        crcStartDate: "2022-02-06",
        facilityName: "Facility 73",
      },
      usIdInCrcFacilityOrPwccUnit1For60Days: {
        sixtyDaysInCrcFacilityDate: "2022-04-07",
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  };

  expect(usIdExpandedCRCSchema.parse(rawRecord)).toMatchSnapshot();
});

test("transforms record with TPD set", () => {
  const rawRecord: UsIdExpandedCRCReferralRecordRaw = {
    stateCode: "US_MI",
    externalId: "xcrc-eligible-02",
    eligibleCriteria: {
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      notServingForSexualOffense: null,
      usIdNoDetainersForXcrcAndCrc: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd: {
        fullTermCompletionDate: null,
        paroleEligibilityDate: null,
        tentativeParoleDate: "2022-07-11",
      },
      usIdInCrcFacilityOrPwccUnit1: {
        crcStartDate: "2022-02-06",
        facilityName: "Vault 6",
      },
      usIdInCrcFacilityOrPwccUnit1For60Days: {
        sixtyDaysInCrcFacilityDate: "2022-04-07",
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  };

  expect(usIdExpandedCRCSchema.parse(rawRecord)).toMatchSnapshot();
});

test("transforms record with caseNotes set", () => {
  const rawRecord: UsIdExpandedCRCReferralRecordRaw = {
    stateCode: "US_MI",
    externalId: "xcrc-eligible-02",
    eligibleCriteria: {
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      notServingForSexualOffense: null,
      usIdNoDetainersForXcrcAndCrc: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd: {
        fullTermCompletionDate: null,
        paroleEligibilityDate: null,
        tentativeParoleDate: "2022-07-11",
      },
      usIdInCrcFacilityOrPwccUnit1: {
        crcStartDate: "2022-02-06",
        facilityName: "Vault 6",
      },
      usIdInCrcFacilityOrPwccUnit1For60Days: {
        sixtyDaysInCrcFacilityDate: "2022-04-07",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      SomeSection: [
        {
          noteBody: "Some pig!",
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
  };

  expect(usIdExpandedCRCSchema.parse(rawRecord)).toMatchSnapshot();
});
