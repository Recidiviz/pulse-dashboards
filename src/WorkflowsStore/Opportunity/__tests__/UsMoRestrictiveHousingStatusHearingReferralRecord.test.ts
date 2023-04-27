// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import tk from "timekeeper";

import { OpportunityValidationError } from "../../../errors";
import {
  UsMoRestrictiveHousingStatusHearingReferralRecordRaw,
  usMoRestrictiveHousingStatusHearingSchema,
  validateReferral,
} from "../UsMoRestrictiveHousingStatusHearingReferralRecord";

const rawRecord: UsMoRestrictiveHousingStatusHearingReferralRecordRaw = {
  stateCode: "US_MO",
  externalId: "004",
  eligibleCriteria: {
    usMoHasUpcomingHearing: {
      nextReviewDate: "2023-11-03",
    },
    usMoInRestrictiveHousing: {
      confinementType: "confinement type",
    },
  },
  metadata: {
    mostRecentHearingDate: "2022-09-03",
    mostRecentHearingType: "hearing type",
    mostRecentHearingFacility: "FACILITY NAME",
    mostRecentHearingComments: "Reason for Hearing: 30 day review",
    currentFacility: "FACILITY 01",
    restrictiveHousingStartDate: "2022-10-01",
    bedNumber: "03",
    roomNumber: "05",
    complexNumber: "2",
    buildingNumber: "13",
    housingUseCode: "HOS",
    majorCdvs: [
      {
        cdvDate: "2022-02-20",
        cdvRule: "Rule 7.2",
      },
    ],
    cdvsSinceLastHearing: [],
    numMinorCdvsBeforeLastHearing: "3",
  },
};
const today = new Date(2023, 10, 3);

beforeEach(() => {
  tk.freeze(today);
});

afterEach(() => {
  tk.reset();
});

test("transform record", () => {
  expect(
    usMoRestrictiveHousingStatusHearingSchema.parse(rawRecord)
  ).toMatchSnapshot();
});

test("record validates: next review date today", () => {
  expect(() =>
    validateReferral(usMoRestrictiveHousingStatusHearingSchema.parse(rawRecord))
  ).not.toThrow(OpportunityValidationError);
});

test("record does not validate: next review date yesterday", () => {
  const recordYesterday = {
    ...rawRecord,
    eligibleCriteria: {
      usMoHasUpcomingHearing: {
        nextReviewDate: "2023-11-02",
      },
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
  };
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(recordYesterday)
    )
  ).toThrow(OpportunityValidationError);
});
