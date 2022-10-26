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

import { identity } from "lodash";

import { OpportunityValidationError } from "../../utils";
import {
  getTransformer,
  getValidator,
} from "../SupervisionLevelDowngradeReferralRecord";

const supervisionLevelDowngradeRecordRaw = {
  stateCode: "US_XX",
  externalId: "abc123",
  criteria: {
    usTnSupervisionLevelHigherThanAssessmentLevel: {
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

test("transform function", () => {
  expect(
    getTransformer(identity)(supervisionLevelDowngradeRecordRaw)
  ).toMatchSnapshot();
});

test("record validates", () => {
  const validator = getValidator(mockClient as any);
  expect(validator(supervisionLevelDowngradeRecordRaw)).toBeDefined();
});

test("record does not validate", () => {
  const validator = getValidator({
    ...mockClient,
    supervisionLevel: "MEDIUM",
  } as any);
  expect(() => validator(supervisionLevelDowngradeRecordRaw)).toThrow(
    OpportunityValidationError
  );
});
