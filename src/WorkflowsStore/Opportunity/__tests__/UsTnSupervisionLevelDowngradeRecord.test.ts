// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { cloneDeep, identity } from "lodash";

import { OpportunityValidationError } from "../../utils";
import {
  getTransformer,
  getValidator,
  UsTnSupervisionLevelDowngradeReferralRecord,
} from "../UsTnSupervisionLevelDowngradeReferralRecord";

const usTnSupervisionLevelDowngradeRecordRaw = {
  stateCode: "US_XX",
  externalId: "abc123",
  criteria: {
    supervisionLevelHigherThanAssessmentLevel: {
      assessmentLevel: "HIGH",
      latestAssessmentDate: "2021-08-20",
      supervisionLevel: "MAXIMUM",
    },
  },
  metadata: {
    violations: [
      { violationDate: "2021-05-03", violationCode: "VRPT" },
      { violationDate: "2020-01-10", violationCode: "ARRP" },
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
  getTransformer(identity)(
    usTnSupervisionLevelDowngradeRecordRaw
  ) as UsTnSupervisionLevelDowngradeReferralRecord;

test("transform function", () => {
  expect(getTransformedRecord()).toMatchSnapshot();
});

test("transform function processes old key", () => {
  const record = cloneDeep(usTnSupervisionLevelDowngradeRecordRaw) as Record<
    string,
    any
  >;
  record.criteria = {
    usTnSupervisionLevelHigherThanAssessmentLevel: {
      assessmentLevel: "HIGH",
      latestAssessmentDate: "2021-08-20",
      supervisionLevel: "MAXIMUM",
    },
  };
  const transformedRecord = getTransformer(identity)(record);
  if (!transformedRecord) {
    throw new Error(
      "unable to transform usTnSupervisionLevelDowngradeRecordRaw"
    );
  }
  expect(
    "usTnSupervisionLevelHigherThanAssessmentLevel" in
      transformedRecord.criteria
  ).toBeFalse();
  expect(
    "supervisionLevelHigherThanAssessmentLevel" in transformedRecord.criteria
  ).toBeTrue();
  expect(transformedRecord).toMatchSnapshot();
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
    OpportunityValidationError
  );
});
