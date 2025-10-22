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

import { relativeFixtureDate } from "../../../utils/zod";
import { RawResidentRecord, residentRecordSchema } from "../schema";

const metadata = {
  stateCode: "US_TN" as const,
  expirationDate: relativeFixtureDate({ years: 1, days: 249 }),
  expirationDateOriginal: relativeFixtureDate({ years: 3, days: 300 }),
  fileUpdateDate: relativeFixtureDate({ days: -1 }),
  releaseEligibilityDate: relativeFixtureDate({ days: 222 }),
  sentenceEffectiveDate: relativeFixtureDate({ years: -2, days: -222 }),
  creditActivity: [
    {
      creditDate: relativeFixtureDate({ months: -11 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -11 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -10 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -10 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -9 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -9 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -8 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -8 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -7 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -7 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -6 }),
      creditType: "PROGRAM" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -6 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -5 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -4 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -3 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -3 }),
      creditType: "REMOVAL" as const,
      creditsEarned: -10,
    },
    {
      creditDate: relativeFixtureDate({ months: -2 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
    {
      creditDate: relativeFixtureDate({ months: -1 }),
      creditType: "BEHAVIOR" as const,
      creditsEarned: 6,
    },
  ],
};

export const rawUsTnResidents: Array<RawResidentRecord> = [
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    stateCode: "US_TN",
    personExternalId: "RES001",
    recordId: "us_tn_res001",
    displayId: "dRES001",
    personName: {
      givenNames: "Carmen",
      surname: "Reyes",
    },
    gender: "MALE",
    pseudonymizedId: "anonres001",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "CLOSE",
    admissionDate: relativeFixtureDate({ years: -2, days: -200 }),
    releaseDate: relativeFixtureDate({ years: 3, days: 300 }),
    metadata,
  },
  {
    allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
    stateCode: "US_TN",
    personExternalId: "RES002",
    recordId: "us_tn_res002",
    displayId: "dRES002",
    personName: {
      givenNames: "Jessica",
      surname: "Ren",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres002",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -4, days: -400 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 100 }),
    metadata,
  },
  {
    allEligibleOpportunities: [
      "usTnAnnualReclassification",
      "usTnInitialClassification",
    ],
    stateCode: "US_TN",
    personExternalId: "RES003",
    recordId: "us_tn_res003",
    displayId: "dRES003",
    personName: {
      givenNames: "Fei",
      surname: "Jackson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "MEDIUM",
    admissionDate: relativeFixtureDate({ years: -3, days: -100 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 100 }),
    metadata,
  },
  {
    allEligibleOpportunities: [
      "usTnAnnualReclassification",
      "usTnInitialClassification",
    ],
    stateCode: "US_TN",
    personExternalId: "RES004",
    recordId: "us_tn_res004",
    displayId: "dRES004",
    personName: {
      givenNames: "Geoff",
      surname: "Zhang",
    },
    gender: "INTERNAL_UNKNOWN",
    pseudonymizedId: "anonres004",
    facilityId: "BLEDSOE_CC",
    unitId: "UNIT A",
    facilityUnitId: "BLEDSOE_CC‡UNIT A",
    custodyLevel: "CLOSE",
    admissionDate: relativeFixtureDate({ years: -2, days: -200 }),
    releaseDate: relativeFixtureDate({ years: 1, days: 200 }),
    metadata,
  },
];

export const usTnResidents = rawUsTnResidents.map((r) =>
  residentRecordSchema.parse(r),
);
