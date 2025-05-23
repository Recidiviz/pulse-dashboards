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
  usMiReclassificationRequestRecord,
  usMiReclassificationRequestSchema,
} from "./schema";

export const usMiReclassificationRequestFixtures = {
  fullyEligible1: makeRecordFixture(usMiReclassificationRequestSchema, {
    stateCode: "US_MI",
    externalId: "RES019",
    eligibleCriteria: {
      usMiEligibleForReclassificationFromSolitaryToGeneral: {
        detentionSanctionHasExpired: true,
        sanctionExpirationDate: relativeFixtureDate({ days: -5 }),
        overdueInTemporary: null,
        overdueInTemporaryDate: null,
      },
    },
    formInformation: {},
    ineligibleCriteria: {},
    metadata: {
      solitaryConfinementType: "DISCIPLINARY_SOLITARY_CONFINEMENT",
      daysInSolitary: 15,
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
  fullyEligible2: makeRecordFixture(usMiReclassificationRequestSchema, {
    stateCode: "US_MI",
    externalId: "RES020",
    eligibleCriteria: {
      usMiEligibleForReclassificationFromSolitaryToGeneral: {
        detentionSanctionHasExpired: null,
        sanctionExpirationDate: null,
        overdueInTemporary: true,
        overdueInTemporaryDate: relativeFixtureDate({ days: -3 }),
      },
    },
    formInformation: {},
    ineligibleCriteria: {},
    metadata: {
      solitaryConfinementType: "TEMPORARY_SOLITARY_CONFINEMENT",
      daysInSolitary: 31,
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
  almostEligible: makeRecordFixture(usMiReclassificationRequestSchema, {
    stateCode: "US_MI",
    externalId: "RES021",
    eligibleCriteria: {},
    formInformation: {},
    ineligibleCriteria: {
      usMiEligibleForReclassificationFromSolitaryToGeneral: {
        detentionSanctionHasExpired: null,
        sanctionExpirationDate: null,
        overdueInTemporary: true,
        overdueInTemporaryDate: relativeFixtureDate({ days: 3 }),
      },
    },
    metadata: {
      solitaryConfinementType: "TEMPORARY_SOLITARY_CONFINEMENT",
      daysInSolitary: 27,
    },
    isEligible: false,
    isAlmostEligible: true,
  }),
} satisfies FixtureMapping<usMiReclassificationRequestRecord>;
