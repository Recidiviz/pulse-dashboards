// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { UsTnExpirationReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTnExpirationReferralRecord";
import { FixtureData } from "../workflowsFixtures";
import { externalIdFunc } from "./utils";

const data: UsTnExpirationReferralRecordRaw[] = [
  {
    stateCode: "US_TN",
    externalId: "101",
    formInformation: {
      offenses: ["FAILURE TO APPEAR (FELONY)", "FAILURE TO APPEAR (FELONY)"],
      convictionCounties: ["010"],
      docketNumbers: ["123", "456"],
      latestPse: {
        contactDate: "2022-06-01",
        contactType: "PSET",
      },
      sexOffenses: ["sex offense"],
      gangAffiliationId: "Gang A",
      latestEmp: {
        contactDate: "2022-05-05",
        contactType: "EMPV",
        contactComment: "Comment about employment",
      },
      latestFee: {
        contactDate: "2022-04-04",
        contactType: "FEEP",
      },
      latestSpe: {
        contactDate: "2022-05-05",
        contactType: "SPEC",
        contactComment: "Special conditions check",
      },
      latestVrr: {
        contactDate: "2022-03-03",
        contactType: "VRRE",
      },
      newOffenses: [
        {
          contactDate: "2022-02-09",
          contactType: "NCAF",
          contactComment: "ARRESTED",
        },
        {
          contactDate: "2022-02-17",
          contactType: "NCAC",
          contactComment: "INTERROGATED",
        },
      ],
      alcoholHistory: [
        {
          contactDate: "2022-02-12",
          contactType: "FSWR",
          contactComment: "HAD APPOINTMENT",
        },
        {
          contactDate: "2022-02-07",
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
          eventDate: "2022-06-17",
        },
      ],
    },
    criteria: {
      supervisionPastFullTermCompletionDateOrUpcoming1Day: {
        eligibleDate: "2022-02-11",
      },
      usTnNoZeroToleranceCodesSpans: {},
      usTnNotOnLifeSentenceOrLifetimeSupervision: {
        lifetimeFlag: false,
      },
    },
  },
];

export const usTnExpirationFixture: FixtureData<UsTnExpirationReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
