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

import { relativeFixtureDate } from "../../../../utils/zod";
import { RawUsTnResidentCommon } from "./schema";

export const rawUsTnCommonMetadata: RawUsTnResidentCommon = {
  stateCode: "US_TN",
};

export const rawUsTnResidentMetadata = {
  ...rawUsTnCommonMetadata,
  latestClassificationDate: relativeFixtureDate({ days: -172 }),
  latestVantageRiskAssessment: {
    assessmentDate: relativeFixtureDate({ days: -60 }),
    assessmentType: "STRONG_R2",
    assessmentLevel: "HIGH",
    assessmentLevelRawText: "HV",
  },
  convictionDate: relativeFixtureDate({ years: -2, days: -222 }),
  tnSentences: [
    {
      imposedDate: relativeFixtureDate({ years: -2, days: -222 }),
      offenseDate: relativeFixtureDate({ years: -2, days: -260 }),
      statute: "39-13-210",
      description: "Manslaughter",
      classificationType: "Felony",
      classificationSubtype: "C",
      countyCode: "047",
      isViolent: true,
      isSexOffense: false,
    },
  ],
  iscSentences: [],
  diversionSentences: [],
  phoneNumber: "6155551234",
  address: "123 Main St, Nashville, TN 37201",
};
