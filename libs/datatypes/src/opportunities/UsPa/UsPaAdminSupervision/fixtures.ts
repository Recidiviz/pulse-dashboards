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

import { makeRecordFixture } from "../../../utils/zod/object/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import {
  UsPaAdminSupervisionRecord,
  usPaAdminSupervisionSchema,
} from "./schema";

const baseInput = {
  stateCode: "US_PA",
  externalId: "abc123",
  ineligibleCriteria: {},
  metadata: { tabName: "ELIGIBLE_NOW" as const },
  formInformation: {
    drugConviction: true,
    statute14: false,
    statute30: true,
    statute37: false,
    drugUnreportedDisposition: true,
  },
  isEligible: true,
  isAlmostEligible: false,
};

export const usPaAdminSupervisionFixtures = {
  fullyEligible: makeRecordFixture(usPaAdminSupervisionSchema, {
    ...baseInput,
    eligibleCriteria: {
      usPaNoHighSanctionsInPastYear: {},
      usPaNotServingIneligibleOffenseForAdminSupervision: {
        ineligibleOffenses: ["ABC", "DEF"],
        ineligibleSentencesExpirationDate: ["2023-06-01", "2022-01-01"],
      },
    },
  }),
  nullReasonFields: makeRecordFixture(usPaAdminSupervisionSchema, {
    ...baseInput,
    eligibleCriteria: {
      usPaNoHighSanctionsInPastYear: null,
      usPaNotServingIneligibleOffenseForAdminSupervision: null,
    },
  }),
  emptyIneligibleOffenses: makeRecordFixture(usPaAdminSupervisionSchema, {
    ...baseInput,
    eligibleCriteria: {
      usPaNoHighSanctionsInPastYear: {},
      usPaNotServingIneligibleOffenseForAdminSupervision: {
        ineligibleOffenses: [],
        ineligibleSentencesExpirationDate: [],
      },
    },
  }),
} satisfies FixtureMapping<UsPaAdminSupervisionRecord>;
