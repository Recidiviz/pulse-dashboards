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

import { relativeFixtureDate } from "../../../utils/zod/date/fixtureDates";
import { makeRecordFixture } from "../../../utils/zod/object/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import {
  UsPaSpecialCircumstancesSupervisionRecord,
  usPaSpecialCircumstancesSupervisionSchema,
} from "./schema";

export const usPaSpecialCircumstancesSupervisionFixtures = {
  fullyEligible: makeRecordFixture(usPaSpecialCircumstancesSupervisionSchema, {
    stateCode: "US_PA",
    externalId: "CLIENT004",
    eligibleCriteria: {
      usPaMeetsSpecialCircumstancesCriteriaForTimeServed: {
        caseType: "special probation or parole case",
        yearsRequiredToServe: 10,
        eligibleDate: relativeFixtureDate({ days: -10 }),
      },
      usPaMeetsSpecialCircumstancesCriteriaForSanctions: {
        caseType: "special probation or parole case",
        sanctionType: "high",
      },
      usPaFulfilledRequirements: {},
      usPaNotEligibleOrMarkedIneligibleForAdminSupervision: {},
    },
    ineligibleCriteria: {},
    caseNotes: {
      "Case Plan Goals": [
        {
          eventDate: null,
          noteBody: "Maintain good health",
          noteTitle: "In progress",
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
  almostEligible: makeRecordFixture(usPaSpecialCircumstancesSupervisionSchema, {
    stateCode: "US_PA",
    externalId: "CLIENT005",
    eligibleCriteria: {
      usPaMeetsSpecialCircumstancesCriteriaForSanctions: {
        caseType: "special probation or parole case",
        sanctionType: "high or medium",
      },
      usPaFulfilledRequirements: {},
      usPaNotEligibleOrMarkedIneligibleForAdminSupervision: {},
    },
    ineligibleCriteria: {
      usPaMeetsSpecialCircumstancesCriteriaForTimeServed: {
        caseType: "special probation or parole case",
        yearsRequiredToServe: 10,
        eligibleDate: relativeFixtureDate({ days: 10 }),
      },
    },
    caseNotes: {
      "Case Plan Goals": [
        {
          eventDate: null,
          noteBody: "Maintain good health",
          noteTitle: "In progress",
        },
      ],
    },
    isEligible: false,
    isAlmostEligible: true,
  }),
} satisfies FixtureMapping<UsPaSpecialCircumstancesSupervisionRecord>;
