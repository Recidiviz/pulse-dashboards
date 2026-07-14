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

import { relativeFixtureDate } from "../../../utils/zod";
import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsTnInitialClassificationRecord,
  usTnInitialClassificationSchema,
} from "./schema";

export const usTnInitialClassificationFixtures = {
  fullyEligible: makeRecordFixture(usTnInitialClassificationSchema, {
    stateCode: "US_TN",
    externalId: "RES003",
    formReclassificationDueDate: relativeFixtureDate({ days: 2 }),
    eligibleCriteria: {
      usTnAtLeast12MonthsSinceLatestAssessment: null,
      custodyLevelIsNotMax: null,
    },
    ineligibleCriteria: {},
    caseNotes: {
      "PRIOR RECORD OFFENSES": [
        {
          eventDate: relativeFixtureDate({ years: -2, months: -2, days: -2 }),
          noteTitle: "AGGRAVATED ASSAULT",
        },
        {
          eventDate: relativeFixtureDate({ years: -2, months: -1, days: -10 }),
          noteTitle: "CRIMINAL IMPERSONATION",
        },
      ],
      "TN, ISC, DIVERSION SENTENCES": [
        {
          eventDate: relativeFixtureDate({ years: -3, days: -6 }),
          noteBody: "Expires: 2028-02-02",
          noteTitle: "POSS FIREARM W/PRIOR VIOL/DEAD WPN CONV",
        },
      ],
    },
    formInformation: {
      currentOffenses: ["POSS FIREARM W/PRIOR VIOL/DEAD WPN CONV"],
      hasIncompatibles: false,
      lastAssessmentDate: relativeFixtureDate({ days: -363 }),
      lastAssessmentTotalScore: "15",
      latestClassificationDate: relativeFixtureDate({ days: -355 }),
      latestVantageCompletedDate: relativeFixtureDate({ days: -300 }),
      latestVantageRiskLevel: "LOW",
      levelOfCare: "LVL2",
      sentenceReleaseEligibilityDate: relativeFixtureDate({ months: 2 }),
      sentenceExpirationDate: relativeFixtureDate({ years: 1, days: 100 }),
      statusAtHearingSeg: "GEN",
      q1Score: 0,
      q2Score: 0,
      q3Score: null,
      q4Score: null,
      q5Score: null,
      q6Score: -2,
      q7Score: 5,
      q7Notes: {
        noteBody: "Class B Incident",
        eventDate: relativeFixtureDate({ years: -1, months: -2, days: -20 }),
      },
      q8Score: 0,
      q9Score: null,
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsTnInitialClassificationRecord>;
