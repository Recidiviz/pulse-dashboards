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

import { z } from "zod";

import { usMoClientMetadataSchema } from "./schema";

// Reusable raw-input fixture (the schema transforms date strings into `Date`s,
// so this is typed against the *input* shape). Modeled on a real US_MO record
// that has both an ORAS assessment and a case plan.
export const usMoClientMetadataFixture: z.input<
  typeof usMoClientMetadataSchema
> = {
  stateCode: "US_MO",
  sex: "MALE",
  birthdate: "1963-06-25",
  latestCycleSentences: [
    {
      classificationType: "FELONY",
      classificationSubtype: "D",
      statute: "579015",
      description: "POSSESSION OF CONTROLLED SUBSTANCE",
    },
    {
      classificationType: "FELONY",
      classificationSubtype: "D",
      statute: "579015",
      description: "POSSESSION OF CONTROLLED SUBSTANCE",
    },
  ],
  orasAssessment: {
    assessmentScore: 23,
    assessmentType: "ORAS_COMMUNITY_SUPERVISION",
    assessmentAdministeredBy: "MaryAnn Harper",
    assessmentDate: "2026-04-10",
    lastUpdated: "2026-06-01",
  },
  casePlan: [
    {
      goal: "RS02A-Maintain Pro-Social Housing",
      objectivesAndTechniques: [
        {
          objective: "RS01.001-Research viable/ stable home plan options",
          objectiveEndDate: null,
          techniques: ["IC01-Verbal Affirmation/admonishment  as needed"],
        },
        {
          objective:
            "RS01.002-Submit selected home plan to Probation and Parole Officer",
          objectiveEndDate: null,
          techniques: [
            "IC01-Verbal Affirmation",
            "IC01-Verbal Affirmation/admonishment  as needed",
          ],
        },
        {
          objective:
            "RS02.001-Identify support needs in home plan area (clothing, transportation, child care, etc.)",
          objectiveEndDate: null,
          techniques: [
            "SV02-Service Referral:  Basic Needs",
            "SV02-Service Referral:  Basic Needs",
            "SV02-Service Referral:  Basic Needs",
          ],
        },
      ],
    },
    {
      goal: "SU02A-Maintain a Sober Lifestyle",
      objectivesAndTechniques: [
        {
          objective: "SU01.001-No violations for drug use",
          objectiveEndDate: null,
          techniques: ["IC01-Verbal Affirmation"],
        },
        {
          objective: "SU01.005-Attend the support group of my choosing",
          objectiveEndDate: null,
          techniques: ["SV04-Service Referral:  Other"],
        },
      ],
    },
  ],
};
