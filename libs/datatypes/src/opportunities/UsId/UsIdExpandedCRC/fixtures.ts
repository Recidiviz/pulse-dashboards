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
import { UsIdExpandedCRCRecord, usIdExpandedCRCSchema } from "./schema";

export const usIdExpandedCRCFixtures = {
  ftcdAndPed: makeRecordFixture(usIdExpandedCRCSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES001",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdIncarcerationWithin6MonthsOfFtcdOrPedOrEprd: {
        fullTermCompletionDate: relativeFixtureDate({ months: 4 }),
        paroleEligibilityDate: relativeFixtureDate({ months: 2 }),
      },
      usIdInCrcFacilityOrPwccUnit1: {
        crcStartDate: relativeFixtureDate({ months: -6 }),
        facilityName: "PRC",
      },
      usIdInCrcFacilityOrPwccUnit1For60Days: {
        sixtyDaysInCrcFacilityDate: relativeFixtureDate({ months: -4 }),
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
  tpdRecord: makeRecordFixture(usIdExpandedCRCSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES002",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdIncarcerationWithin6MonthsOfFtcdOrPedOrEprd: {
        fullTermCompletionDate: null,
        paroleEligibilityDate: null,
      },
      usIdInCrcFacilityOrPwccUnit1: {
        crcStartDate: relativeFixtureDate({ months: -6 }),
        facilityName: "Vault 6",
      },
      usIdInCrcFacilityOrPwccUnit1For60Days: {
        sixtyDaysInCrcFacilityDate: relativeFixtureDate({ months: -4 }),
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  }),
  withCaseNotes: makeRecordFixture(usIdExpandedCRCSchema, {
    stateCode: "US_ID",
    externalId: "ID_RES003",
    eligibleCriteria: {
      custodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdIncarcerationWithin6MonthsOfFtcdOrPedOrEprd: {
        fullTermCompletionDate: null,
        paroleEligibilityDate: null,
      },
      usIdInCrcFacilityOrPwccUnit1: {
        crcStartDate: relativeFixtureDate({ months: -6 }),
        facilityName: "Vault 6",
      },
      usIdInCrcFacilityOrPwccUnit1For60Days: {
        sixtyDaysInCrcFacilityDate: relativeFixtureDate({ months: -4 }),
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      SomeSection: [{ noteBody: "Some pig!" }],
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsIdExpandedCRCRecord>;
