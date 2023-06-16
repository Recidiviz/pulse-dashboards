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

import { FeatureGateError, OpportunityValidationError } from "../../../errors";
import {
  UsMoRestrictiveHousingStatusHearingReferralRecordRaw,
  usMoRestrictiveHousingStatusHearingSchema,
  validateReferral,
} from "../UsMoRestrictiveHousingStatusHearingReferralRecord";

const rawRecordBase: Omit<
  UsMoRestrictiveHousingStatusHearingReferralRecordRaw,
  "eligibleCriteria" | "ineligibleCriteria"
> = {
  stateCode: "US_MO",
  externalId: "004",
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

const rawRecordPreviousFormat: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
  {
    ...rawRecordBase,
    eligibleCriteria: {
      usMoHasUpcomingHearing: {
        nextReviewDate: "2023-11-03",
      },
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {},
  };

const rawRecordNewFormatUpcomingHearing: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
  {
    ...rawRecordBase,
    eligibleCriteria: {
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {
      usMoOverdueForHearing: {
        nextReviewDate: "2023-11-03",
      },
    },
  };

const rawRecordNewFormatOverdue: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
  {
    ...rawRecordBase,
    eligibleCriteria: {
      usMoOverdueForHearing: {
        nextReviewDate: "2023-10-03",
      },
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {},
  };

const rawRecordNewFormatMissingHearingDate: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
  {
    ...rawRecordBase,
    eligibleCriteria: {
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {
      usMoOverdueForHearing: {
        nextReviewDate: null,
      },
    },
  };

const rawRecordNewFormatHearingDateFarInFuture: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
  {
    ...rawRecordBase,
    eligibleCriteria: {
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {
      usMoOverdueForHearing: {
        nextReviewDate: "2024-01-01",
      },
    },
  };

const today = new Date(2023, 10, 3);

beforeEach(() => {
  tk.freeze(today);
});

afterEach(() => {
  tk.reset();
});

test("transform record: previous format", () => {
  expect(
    usMoRestrictiveHousingStatusHearingSchema.parse(rawRecordPreviousFormat)
  ).toMatchSnapshot();
});

test("transform record: new format", () => {
  expect(
    usMoRestrictiveHousingStatusHearingSchema.parse(
      rawRecordNewFormatUpcomingHearing
    )
  ).toMatchSnapshot();
});

test("record validates: next review date today", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(rawRecordPreviousFormat)
    )
  ).not.toThrow(OpportunityValidationError);
});

test("record validates: next review date today", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(
        rawRecordNewFormatUpcomingHearing
      )
    )
  ).not.toThrow(OpportunityValidationError);
});

test("record does not validate: next review date yesterday", () => {
  const recordYesterday = {
    ...rawRecordPreviousFormat,
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

test("record does not validate: overdue", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(rawRecordNewFormatOverdue)
    )
  ).toThrow(FeatureGateError);
});

test("record does not validate: missing hearing date", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(
        rawRecordNewFormatMissingHearingDate
      )
    )
  ).toThrow(FeatureGateError);
});

test("record does not validate: hearing date far in future", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(
        rawRecordNewFormatHearingDateFarInFuture
      )
    )
  ).toThrow(FeatureGateError);
});
