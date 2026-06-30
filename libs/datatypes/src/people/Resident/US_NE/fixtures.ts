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
import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";
import { RawUsNeResidentMetadata } from "./metadata/schema";

const baseMetadata: RawUsNeResidentMetadata = {
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
  goodTimeLostDaysRestorable: 45,
  deadTimeDays: 0,
  mandatoryMinimumSentenceMonths: 0,
  sentenceLastModifiedDate: relativeFixtureMonth({}, "start"),
  minimumSentenceYears: 8,
  mandatoryMinimumDate: null,
  minimumSentenceMonths: 0,
  sentenceStartDate: relativeFixtureDate({ years: -2, months: -3 }),
  minimumSentenceDays: 0,
  goodTimeBalanceDays: 2922,
  goodTimeAllowedDays: 2922,
  mandatoryMinimumSentenceDays: 0,
  goodTimeLastModifiedDate: relativeFixtureMonth({}, "start"),
  numHoldsAndDetainers: 0,
  criticalDocuments: [],
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
  tentativeReleaseDate: relativeFixtureDate({ years: 2, months: 3 }),
};

const res002Metadata: RawUsNeResidentMetadata = {
  ...baseMetadata,
  goodTimeLostDaysRestorable: 25,
  maximumSentenceYears: 10,
  minimumSentenceYears: 5,
  sentenceStartDate: relativeFixtureDate({ years: -1, months: -8 }),
  tentativeReleaseDate: relativeFixtureDate({ years: 1, months: 6 }),
  lb191Credits: 12,
};

const res003Metadata: RawUsNeResidentMetadata = {
  ...baseMetadata,
  goodTimeLostDaysRestorable: 245,
  maximumSentenceYears: 25,
  minimumSentenceYears: 15,
  sentenceStartDate: relativeFixtureDate({ years: -3, months: -4 }),
  tentativeReleaseDate: relativeFixtureDate({ years: 3, months: 8 }),
  lb191Credits: 32,
  jailTimeDays: 220,
};

const res004Metadata: RawUsNeResidentMetadata = {
  ...baseMetadata,
  goodTimeLostDaysRestorable: 120,
  maximumSentenceYears: 18,
  minimumSentenceYears: 10,
  sentenceStartDate: relativeFixtureDate({ years: -2, months: -7 }),
  tentativeReleaseDate: relativeFixtureDate({ years: 2, months: 9 }),
  lb191Credits: 24,
  jailTimeDays: 189,
};

const res005Metadata: RawUsNeResidentMetadata = {
  ...baseMetadata,
  goodTimeLostDaysRestorable: 85,
  maximumSentenceYears: 14,
  minimumSentenceYears: 8,
  sentenceStartDate: relativeFixtureDate({ years: -2, months: -2 }),
  tentativeReleaseDate: relativeFixtureDate({ years: 1, months: 11 }),
  lb191Credits: 20,
  creditActivity: [
    ...baseMetadata.creditActivity,
    {
      creditsEarned: -15,
      isRestorable: "Y",
      violationDescription: "DISOBEYING A DIRECT ORDER",
      violationCount: "1",
      actionDate: relativeFixtureMonth({ months: -4, days: -15 }, "start"),
      violationCode: "IDC-301",
      creditType: "VIOLATION",
      lastModifiedDate: relativeFixtureMonth(
        { months: -4, days: -15 },
        "start",
      ),
      misconductReportNumber: "MR-2024-105",
      creditDate: relativeFixtureMonth({ months: -4, days: -15 }, "start"),
    },
  ],
};

const res006Metadata: RawUsNeResidentMetadata = {
  ...baseMetadata,
  goodTimeLostDaysRestorable: 160,
  maximumSentenceYears: 20,
  minimumSentenceYears: 12,
  sentenceStartDate: relativeFixtureDate({ years: -2, months: -5 }),
  tentativeReleaseDate: relativeFixtureDate({ years: 2, months: 7 }),
  lb191Credits: 26,
  creditActivity: [
    ...baseMetadata.creditActivity,
    {
      creditsEarned: -90,
      isRestorable: "Y",
      violationDescription: "AGGREV ASSULT/ASSULT/FIGHTING",
      violationCount: "1",
      actionDate: relativeFixtureMonth({ months: -10, days: -10 }, "start"),
      violationCode: "CLASS1-201",
      creditType: "VIOLATION",
      lastModifiedDate: relativeFixtureMonth(
        { months: -10, days: -10 },
        "start",
      ),
      misconductReportNumber: "MR-2024-078",
      creditDate: relativeFixtureMonth({ months: -10, days: -10 }, "start"),
    },
  ],
};

const res007Metadata: RawUsNeResidentMetadata = {
  ...baseMetadata,
  goodTimeLostDaysRestorable: 65,
  maximumSentenceYears: 12,
  minimumSentenceYears: 7,
  sentenceStartDate: relativeFixtureDate({ years: -2, months: -1 }),
  tentativeReleaseDate: relativeFixtureDate({ years: 1, months: 8 }),
  lb191Credits: 16,
  jailTimeDays: 145,
};

export const rawUsNeResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_NE",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001-ne",
    displayId: "RES001",
    personName: { middleNames: "T", givenNames: "Joseph", surname: "Gutmann" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES002",
    pseudonymizedId: "anonres002-ne",
    displayId: "RES002",
    personName: { middleNames: "", givenNames: "Marcus", surname: "Anderson" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES003",
    pseudonymizedId: "anonres003-ne",
    displayId: "RES003",
    personName: { middleNames: "L", givenNames: "David", surname: "Thompson" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES004",
    pseudonymizedId: "anonres004-ne",
    displayId: "RES004",
    personName: { middleNames: "J", givenNames: "Robert", surname: "Martinez" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES005",
    pseudonymizedId: "anonres005-ne",
    displayId: "RES005",
    personName: { middleNames: "A", givenNames: "James", surname: "Wilson" },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES006",
    pseudonymizedId: "anonres006-ne",
    displayId: "RES006",
    personName: {
      middleNames: "",
      givenNames: "Christopher",
      surname: "Davis",
    },
    facilityId: "DEMOFACILITY",
  },
  {
    stateCode: "US_NE",
    personExternalId: "RES007",
    pseudonymizedId: "anonres007-ne",
    displayId: "RES007",
    personName: { middleNames: "R", givenNames: "Michael", surname: "Johnson" },
    facilityId: "DEMOFACILITY",
  },
];

export const usNeResidentCommon = rawUsNeResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsNeResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsNeResidentCommon[0],
    recordId: "us_ne_RES001",
    custodyLevel: "MINIMUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "A-WING",
    unitId: "A-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -3 }),
    metadata: baseMetadata,
  },
  {
    ...rawUsNeResidentCommon[1],
    recordId: "us_ne_RES002",
    custodyLevel: "MINIMUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "A-WING",
    unitId: "A-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -1, months: -8 }),
    metadata: res002Metadata,
  },
  {
    ...rawUsNeResidentCommon[2],
    recordId: "us_ne_RES003",
    custodyLevel: "MEDIUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "B-WING",
    unitId: "B-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -3, months: -4 }),
    metadata: res003Metadata,
  },
  {
    ...rawUsNeResidentCommon[3],
    recordId: "us_ne_RES004",
    custodyLevel: "MINIMUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "C-WING",
    unitId: "C-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -7 }),
    metadata: res004Metadata,
  },
  {
    ...rawUsNeResidentCommon[4],
    recordId: "us_ne_RES005",
    custodyLevel: "MEDIUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "B-WING",
    unitId: "B-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -2 }),
    metadata: res005Metadata,
  },
  {
    ...rawUsNeResidentCommon[5],
    recordId: "us_ne_RES006",
    custodyLevel: "MEDIUM",
    allEligibleOpportunities: ["usNeGoodTimeRestoration"],
    facilityUnitId: "B-WING",
    unitId: "B-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -5 }),
    metadata: res006Metadata,
  },
  {
    ...rawUsNeResidentCommon[6],
    recordId: "us_ne_RES007",
    custodyLevel: "MINIMUM",
    allEligibleOpportunities: [],
    facilityUnitId: "A-WING",
    unitId: "A-WING",
    stateCode: "US_NE",
    gender: "MALE",
    admissionDate: relativeFixtureDate({ years: -2, months: -1 }),
    metadata: res007Metadata,
  },
];

export const usNeResidents = rawUsNeResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
