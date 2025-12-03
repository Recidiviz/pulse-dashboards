// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { relativeFixtureDate, relativeFixtureMonth } from "../../../utils/zod";
import { RawResidentRecord, residentRecordSchema } from "../schema";
import { RawUsNeResidentMetadata } from "./metadata/schema";

const metadata: RawUsNeResidentMetadata = {
  goodTimeLawNumber: "191",
  stateCode: "US_NE",
  sentenceInfoIsCurrent: true,
  lb191Credits: 18,
  maximumSentenceYears: 16,
  paroleEligibilityDate: relativeFixtureDate({ years: 2 }),
  jailTimeDays: 174,
  mandatoryMinimumSentenceYears: 0,
  goodTimeLostDaysNonRestorable: 0,
  maximumSentenceDays: 0,
  maximumSentenceMonths: 0,
  numNotifiers: 0,
  goodTimeLostDaysRestorable: 0,
  deadTimeDays: 0,
  mandatoryMinimumSentenceMonths: 0,
  sentenceLastModifiedDate: relativeFixtureMonth({}, "start"),
  minimumSentenceYears: 8,
  mandatoryMinimumDate: null,
  minimumSentenceMonths: 0,
  sentenceStartDate: relativeFixtureDate({ years: -1, months: -6 }),
  minimumSentenceDays: 0,
  goodTimeBalanceDays: 2922,
  goodTimeAllowedDays: 2922,
  mandatoryMinimumSentenceDays: 0,
  goodTimeLastModifiedDate: relativeFixtureMonth({}, "start"),
  numHoldsAndDetainers: 0,
  creditActivity: [
    {
      creditsEarned: 3,
      isRestorable: null,
      violationDescription: null,
      violationCount: null,
      actionDate: relativeFixtureMonth({ months: -5 }, "start"),
      violationCode: null,
      creditType: "BEHAVIOR",
      lastModifiedDate: relativeFixtureMonth({ months: -5 }, "start"),
      misconductReportNumber: null,
      creditDate: relativeFixtureMonth({ months: -5 }, "start"),
    },
    {
      actionDate: relativeFixtureMonth({ months: -4 }, "start"),
      creditDate: relativeFixtureMonth({ months: -4 }, "start"),
      isRestorable: null,
      lastModifiedDate: relativeFixtureMonth({ months: -4 }, "start"),
      creditsEarned: 3,
      misconductReportNumber: null,
      violationCount: null,
      creditType: "BEHAVIOR",
      violationDescription: null,
      violationCode: null,
    },
    {
      actionDate: relativeFixtureMonth({ months: -3 }, "start"),
      lastModifiedDate: relativeFixtureMonth({ months: -3 }, "start"),
      violationCount: null,
      creditType: "BEHAVIOR",
      violationCode: null,
      misconductReportNumber: null,
      creditDate: relativeFixtureMonth({ months: -3 }, "start"),
      isRestorable: null,
      violationDescription: null,
      creditsEarned: 3,
    },
    {
      violationCode: null,
      violationCount: null,
      lastModifiedDate: relativeFixtureMonth({ months: -2 }, "start"),
      violationDescription: null,
      isRestorable: null,
      actionDate: relativeFixtureMonth({ months: -2 }, "start"),
      misconductReportNumber: null,
      creditDate: relativeFixtureMonth({ months: -2 }, "start"),
      creditType: "BEHAVIOR",
      creditsEarned: 3,
    },
    {
      misconductReportNumber: null,
      isRestorable: null,
      creditType: "BEHAVIOR",
      violationCount: null,
      violationCode: null,
      creditDate: relativeFixtureMonth({ months: -1 }, "start"),
      actionDate: relativeFixtureMonth({ months: -1 }, "start"),
      lastModifiedDate: relativeFixtureMonth({ months: -1 }, "start"),
      violationDescription: null,
      creditsEarned: 3,
    },
    {
      violationCount: null,
      creditDate: relativeFixtureMonth({}, "start"),
      lastModifiedDate: relativeFixtureMonth({}, "start"),
      misconductReportNumber: null,
      actionDate: relativeFixtureMonth({}, "start"),
      creditType: "BEHAVIOR",
      violationDescription: null,
      isRestorable: null,
      creditsEarned: 3,
      violationCode: null,
    },
  ],
  tentativeReleaseDate: relativeFixtureDate({ years: 6, days: -10 }),
};

export const rawUsNeResidents: Array<RawResidentRecord> = [
  {
    displayId: "RES001",
    admissionDate: relativeFixtureDate({ years: -1, months: -6 }),
    gender: "MALE",
    personName: {
      middleNames: "",
      givenNames: "Joseph",
      surname: "Gutmann",
    },
    personExternalId: "RES001",
    recordId: "us_ne_RES001",
    custodyLevel: "MINIMUM",
    pseudonymizedId: "anonres001",
    facilityId: "DEMOFACILITY",
    facilityUnitId: null,
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    unitId: null,
    stateCode: "US_NE",
    metadata,
  },
];

export const usNeResidents = rawUsNeResidents.map((r) =>
  residentRecordSchema.parse(r),
);
