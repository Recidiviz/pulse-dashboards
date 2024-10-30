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

import { identity } from "lodash";
import { z } from "zod";

import { fieldToDate } from "~datatypes";

import { OpportunityValidationError } from "../../../../errors";
import {
  getUsTnExpirationValidator as getValidator,
  usTnExpirationSchema,
} from "../UsTnExpirationOpportunity/UsTnExpirationReferralRecord";

const usTnExpirationRecordRaw: z.input<typeof usTnExpirationSchema> = {
  stateCode: "US_XX",
  externalId: "abc123",
  formInformation: {
    offenses: ["FAILURE1", "FAILURE2"],
    convictionCounties: ["010"],
    docketNumbers: ["123", "456"],
    latestPse: {
      contactDate: "2022-06-01",
      contactType: "PSET",
    },
    sexOffenses: ["sex offense"],
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
  eligibleCriteria: {
    supervisionPastFullTermCompletionDateOrUpcoming1Day: {
      eligibleDate: "2022-03-03",
    },
    usTnNoZeroToleranceCodesSpans: {},
    usTnNotOnLifeSentenceOrLifetimeSupervision: {
      lifetimeFlag: false,
    },
  },
  ineligibleCriteria: {},
};

const mockClient = {
  expirationDate: fieldToDate("2022-03-03"),
  rootStore: {
    workflowsStore: {
      formatSupervisionLevel: identity,
    },
  },
};

test("transform function", () => {
  expect(usTnExpirationSchema.parse(usTnExpirationRecordRaw)).toMatchSnapshot();
});

test("record validates", () => {
  const validator = getValidator(mockClient as any);
  expect(() =>
    validator(usTnExpirationSchema.parse(usTnExpirationRecordRaw)),
  ).not.toThrow(OpportunityValidationError);
});

test("record does not validate", () => {
  const validator = getValidator({
    ...mockClient,
    expirationDate: fieldToDate("2022-04-04"),
  } as any);
  expect(() =>
    validator(usTnExpirationSchema.parse(usTnExpirationRecordRaw)),
  ).toThrow(OpportunityValidationError);
});
