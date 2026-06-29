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

import { makeRecordFixture, relativeFixtureDate } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import { UsIdLsuRecord, usIdLsuSchema } from "./schema";

export const usIdLsuFixtures = {
  fullyEligible: makeRecordFixture(usIdLsuSchema, {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {
      chargeDescriptions: ["GRAND THEFT BY POSSESSION"],
      currentAddress: "123 FAKE ST, TWIN FALLS, ID, 99999-9876",
      assessmentDate: relativeFixtureDate({ months: -4 }),
      assessmentScore: "25",
      latestNegativeDrugScreenDate: relativeFixtureDate({ months: -2 }),
      txDischargeDate: relativeFixtureDate({ months: -10 }),
      txNoteTitle: "TX GOAL",
      txNoteBody: "TX Goal: Complete GEO successfully.",
    },
    eligibleCriteria: {
      usIdLsirLevelLowFor90Days: {
        riskLevel: "LOW",
        eligibleDate: relativeFixtureDate({ months: -3 }),
      },
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: relativeFixtureDate({ months: -2 }),
      },
      underSupervisionCustodialAuthorityAtLeastOneYear: {
        eligibleDate: relativeFixtureDate({ months: -6 }),
      },
      usIdNoActiveNco: {
        activeNco: false,
      },
    },
    ineligibleCriteria: {},
    eligibleStartDate: relativeFixtureDate({ months: -1 }),
    isEligible: true,
    isAlmostEligible: false,
  }),
  optionalCriteriaHaveSaneFallbacks: makeRecordFixture(usIdLsuSchema, {
    stateCode: "US_ID",
    externalId: "003",
    formInformation: {},
    eligibleCriteria: {
      usIdLsirLevelLowFor90Days: {
        riskLevel: "LOW",
        eligibleDate: relativeFixtureDate({ months: -3 }),
      },
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: relativeFixtureDate({ months: -2 }),
      },
      usIdNoActiveNco: null,
      underSupervisionCustodialAuthorityAtLeastOneYear: {
        eligibleDate: relativeFixtureDate({ months: -6 }),
      },
    },
    ineligibleCriteria: {},
    eligibleStartDate: relativeFixtureDate({ months: -1 }),
    isEligible: true,
    isAlmostEligible: false,
  }),
  almostEligibleIncomeNotVerified: makeRecordFixture(usIdLsuSchema, {
    stateCode: "US_ID",
    externalId: "002",
    formInformation: {
      chargeDescriptions: ["GRAND THEFT BY POSSESSION"],
      currentAddress: "123 FAKE ST, TWIN FALLS, ID, 99999-9876",
      assessmentDate: relativeFixtureDate({ months: -4 }),
      assessmentScore: "25",
    },
    eligibleCriteria: {
      usIdLsirLevelLowFor90Days: {
        riskLevel: "LOW",
        eligibleDate: relativeFixtureDate({ months: -3 }),
      },
      underSupervisionCustodialAuthorityAtLeastOneYear: {
        eligibleDate: relativeFixtureDate({ months: -6 }),
      },
      usIdNoActiveNco: {
        activeNco: false,
      },
    },
    ineligibleCriteria: {
      usIdIncomeVerifiedWithin3Months: null,
    },
    eligibleStartDate: relativeFixtureDate({ months: -1 }),
    isEligible: false,
    isAlmostEligible: true,
  }),
} satisfies FixtureMapping<UsIdLsuRecord>;
