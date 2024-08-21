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

import tk from "timekeeper";

import { OpportunityValidationError } from "../../../../errors";
import {
  UsMoRestrictiveHousingStatusHearingReferralRecordRaw,
  usMoRestrictiveHousingStatusHearingSchema,
  validateReferral,
} from "../UsMoRestrictiveHousingStatusHearingOpportunity";

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

const rawRecordUpcomingHearingToday: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
  {
    ...rawRecordBase,
    eligibleCriteria: {
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {
      usMoOverdueForHearing: {
        nextReviewDate: "2023-11-03", // This should match "today" defined below
      },
    },
  };

const rawRecordOverdue: UsMoRestrictiveHousingStatusHearingReferralRecordRaw = {
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

const rawRecordMissingHearingDate: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
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

const rawRecordMissingHearingDateCriteria: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
  {
    ...rawRecordBase,
    eligibleCriteria: {
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {
      usMoOverdueForHearing: null,
    },
  };

const rawRecordHearingDateFarInFuture: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
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

const rawRecordIneligibleButDateInPast: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
  {
    ...rawRecordBase,
    eligibleCriteria: {
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {
      usMoOverdueForHearing: {
        nextReviewDate: "2023-10-02",
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

test("transform record", () => {
  expect(
    usMoRestrictiveHousingStatusHearingSchema.parse(
      rawRecordUpcomingHearingToday,
    ),
  ).toMatchSnapshot();
  expect(
    usMoRestrictiveHousingStatusHearingSchema.parse(rawRecordOverdue),
  ).toMatchSnapshot();
  expect(
    usMoRestrictiveHousingStatusHearingSchema.parse(
      rawRecordMissingHearingDate,
    ),
  ).toMatchSnapshot();
  expect(
    usMoRestrictiveHousingStatusHearingSchema.parse(
      rawRecordMissingHearingDateCriteria,
    ),
  ).toMatchSnapshot();
});

test("transform ineligible record with hearing date in past into eligible criteria", () => {
  const parsedRecord = usMoRestrictiveHousingStatusHearingSchema.parse(
    rawRecordIneligibleButDateInPast,
  );
  expect(parsedRecord).toMatchSnapshot();
  expect(parsedRecord.ineligibleCriteria).toBeEmpty();
  expect(
    parsedRecord.eligibleCriteria.usMoOverdueForHearing?.nextReviewDate,
  ).toBeDefined();
});

test("record validates: overdue for hearing in the past", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(rawRecordOverdue),
    ),
  ).not.toThrow(OpportunityValidationError);
});

test("record validates: next review date today", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(
        rawRecordUpcomingHearingToday,
      ),
    ),
  ).not.toThrow(OpportunityValidationError);
});

test("record validates: missing hearing date", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(
        rawRecordMissingHearingDate,
      ),
    ),
  ).not.toThrow(OpportunityValidationError);
});

test("record validates: hearing date far in future", () => {
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(
        rawRecordHearingDateFarInFuture,
      ),
    ),
  ).not.toThrow(OpportunityValidationError);
});

test("record does not validate: overdue in the future", () => {
  const overdueInFuture: UsMoRestrictiveHousingStatusHearingReferralRecordRaw =
    {
      ...rawRecordOverdue,
      eligibleCriteria: {
        usMoOverdueForHearing: {
          nextReviewDate: "3000-01-01",
        },
        usMoInRestrictiveHousing: {
          confinementType: "confinement type",
        },
      },
    };
  expect(() =>
    validateReferral(
      usMoRestrictiveHousingStatusHearingSchema.parse(overdueInFuture),
    ),
  ).toThrow(OpportunityValidationError);
});
