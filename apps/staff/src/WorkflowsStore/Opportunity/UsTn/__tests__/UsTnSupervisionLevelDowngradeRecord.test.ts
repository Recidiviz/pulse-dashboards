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

import { OpportunityValidationError } from "../../../../errors";
import {
  getSLDValidator as getValidator,
  UsTnSupervisionLevelDowngradeReferralRecordRaw,
  usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "../UsTnSupervisionLevelDowngradeOpportunity/UsTnSupervisionLevelDowngradeReferralRecord";

const usTnSupervisionLevelDowngradeRecordRaw: UsTnSupervisionLevelDowngradeReferralRecordRaw =
  {
    stateCode: "US_XX",
    externalId: "abc123",
    eligibleCriteria: {
      supervisionLevelHigherThanAssessmentLevel: {
        assessmentLevel: "HIGH",
        latestAssessmentDate: "2021-08-20",
        supervisionLevel: "MAXIMUM",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      Violations: [
        { eventDate: "2021-05-03", noteBody: "VRPT" },
        { eventDate: "2020-01-10", noteBody: "ARRP" },
      ],
    },
  };

const mockClient = {
  supervisionLevel: "MAXIMUM",
  rootStore: {
    workflowsStore: {
      formatSupervisionLevel: identity,
    },
  },
};

const getTransformedRecord = () =>
  usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
    identity,
  ).parse(usTnSupervisionLevelDowngradeRecordRaw);

test("transform function", () => {
  expect(getTransformedRecord()).toMatchSnapshot();
});

test("record validates", () => {
  const validator = getValidator(mockClient as any);
  expect(() => validator(getTransformedRecord())).not.toThrow();
});

test("record does not validate", () => {
  const validator = getValidator({
    ...mockClient,
    supervisionLevel: "MEDIUM",
  } as any);
  expect(() => validator(getTransformedRecord())).toThrow(
    OpportunityValidationError,
  );
});
