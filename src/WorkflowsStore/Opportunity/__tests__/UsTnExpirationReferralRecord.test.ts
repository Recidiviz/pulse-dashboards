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

import { fieldToDate, OpportunityValidationError } from "../../utils";
import {
  getValidator,
  transformReferral,
} from "../UsTnExpirationReferralRecord";

const usTnExpirationRecordRaw = {
  stateCode: "US_XX",
  externalId: "abc123",
  criteria: {
    supervisionPastFullTermCompletionDate: {
      eligibleDate: "2022-03-03",
    },
  },
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
  expect(transformReferral(usTnExpirationRecordRaw)).toMatchSnapshot();
});

test("record validates", () => {
  const validator = getValidator(mockClient as any);
  expect(() =>
    validator(transformReferral(usTnExpirationRecordRaw))
  ).not.toThrow(OpportunityValidationError);
});

test("record does not validate", () => {
  const validator = getValidator({
    ...mockClient,
    expirationDate: fieldToDate("2022-04-04"),
  } as any);
  expect(() => validator(transformReferral(usTnExpirationRecordRaw))).toThrow(
    OpportunityValidationError
  );
});
