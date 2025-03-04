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

import { relativeFixtureDate } from "~datatypes";

import { UsTnExpirationReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTn";
import { externalIdFunc, FirestoreFixture } from "./utils";

const data: UsTnExpirationReferralRecordRaw[] = [
  {
    stateCode: "US_TN",
    externalId: "101",
    formInformation: {
      offenses: ["FAILURE TO APPEAR (FELONY)", "FAILURE TO APPEAR (FELONY)"],
      convictionCounties: ["010"],
      docketNumbers: ["123", "456"],
      latestPse: {
        contactDate: relativeFixtureDate({ days: -28 }),
        contactType: "PSET",
      },
      sexOffenses: [],
      latestEmp: {
        contactDate: relativeFixtureDate({ days: -28 }),
        contactType: "EMPV",
        contactComment: "Employment status updated",
      },
      latestFee: {
        contactDate: relativeFixtureDate({ days: -109 }),
        contactType: "FEEP",
      },
      latestSpe: {
        contactDate: relativeFixtureDate({ days: -49 }),
        contactType: "SPEC",
        contactComment: "Special conditions check",
      },
      latestVrr: {
        contactDate: relativeFixtureDate({ days: -64 }),
        contactType: "VRRE",
      },
      newOffenses: [
        {
          contactDate: relativeFixtureDate({ months: -13, days: -9 }),
          contactType: "NCAF",
          contactComment: "ARRESTED",
        },
        {
          contactDate: relativeFixtureDate({ months: -9, days: -13 }),
          contactType: "NCAC",
          contactComment: "INTERROGATED",
        },
      ],
      alcoholHistory: [
        {
          contactDate: relativeFixtureDate({ days: -49 }),
          contactType: "FSWR",
          contactComment: "HAD APPOINTMENT",
        },
        {
          contactDate: relativeFixtureDate({ days: -121 }),
          contactType: "FSWR",
          contactComment: "HAD ANOTHER APPOINTMENT",
        },
      ],
    },
    caseNotes: {
      "Revocation Hearings": [
        {
          noteTitle: "COHC",
          noteBody: "Court hearing",
          eventDate: relativeFixtureDate({ days: -11 }),
        },
      ],
    },
    eligibleCriteria: {
      supervisionPastFullTermCompletionDate: {
        eligibleDate: relativeFixtureDate({ days: -11 }),
      },
      usTnNoZeroToleranceCodesSpans: {},
      usTnNotOnLifeSentenceOrLifetimeSupervision: {
        lifetimeFlag: false,
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  },
  {
    stateCode: "US_TN",
    externalId: "109",
    formInformation: {
      offenses: ["DRIVING W/A REVOKED LICENSE", "TRAFFIC OFFENSE"],
      convictionCounties: ["010"],
      docketNumbers: ["123", "456"],
      latestPse: {
        contactDate: relativeFixtureDate({ days: -28 }),
        contactType: "PSET",
      },
      sexOffenses: [],
      latestEmp: {
        contactDate: relativeFixtureDate({ days: -28 }),
        contactType: "EMPV",
        contactComment: "Employment status updated",
      },
      latestFee: {
        contactDate: relativeFixtureDate({ days: -109 }),
        contactType: "FEEP",
      },
      latestSpe: {
        contactDate: relativeFixtureDate({ days: -49 }),
        contactType: "SPEC",
        contactComment: "Special conditions check",
      },
      latestVrr: {
        contactDate: relativeFixtureDate({ days: -64 }),
        contactType: "VRRE",
      },
      newOffenses: [
        {
          contactDate: relativeFixtureDate({ months: -13, days: -9 }),
          contactType: "NCAF",
          contactComment: "ARRESTED",
        },
        {
          contactDate: relativeFixtureDate({ months: -9, days: -13 }),
          contactType: "NCAC",
          contactComment: "INTERROGATED",
        },
      ],
      alcoholHistory: [
        {
          contactDate: relativeFixtureDate({ days: -49 }),
          contactType: "FSWR",
          contactComment: "HAD APPOINTMENT",
        },
        {
          contactDate: relativeFixtureDate({ days: -121 }),
          contactType: "FSWR",
          contactComment: "HAD ANOTHER APPOINTMENT",
        },
      ],
    },
    caseNotes: {
      "Revocation Hearings": [
        {
          noteTitle: "COHC",
          noteBody: "Court hearing",
          eventDate: relativeFixtureDate({ days: -9 }),
        },
      ],
    },
    eligibleCriteria: {
      supervisionPastFullTermCompletionDate: {
        eligibleDate: relativeFixtureDate({ days: -2 }),
      },
      usTnNoZeroToleranceCodesSpans: {},
      usTnNotOnLifeSentenceOrLifetimeSupervision: {
        lifetimeFlag: false,
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  },
];

export const usTnExpirationFixture: FirestoreFixture<UsTnExpirationReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
