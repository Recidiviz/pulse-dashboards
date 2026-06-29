// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { usNdEarlyTerminationFixtures } from "./fixtures";
import { usNdEarlyTerminationSchema } from "./schema";

test.each(
  Object.keys(usNdEarlyTerminationFixtures) as Array<
    keyof typeof usNdEarlyTerminationFixtures
  >,
)("schema for %s", (key) => {
  expect(
    usNdEarlyTerminationSchema.parse(usNdEarlyTerminationFixtures[key].input),
  ).toMatchSnapshot();
});

test("eligibleCriteria must not be empty", () => {
  const input = {
    ...usNdEarlyTerminationFixtures.eligible.input,
    eligibleCriteria: {
      supervisionPastEarlyDischargeDate: {},
      usNdImpliedValidEarlyTerminationSupervisionLevel: {},
      usNdImpliedValidEarlyTerminationSentenceType: {},
      usNdNotInActiveRevocationStatus: {},
    },
  };
  expect(usNdEarlyTerminationSchema.safeParse(input).success).toBe(false);
});

test("must not have revocation date", () => {
  const input = {
    ...usNdEarlyTerminationFixtures.eligible.input,
    eligibleCriteria: {
      ...usNdEarlyTerminationFixtures.eligible.input.eligibleCriteria,
      usNdNotInActiveRevocationStatus: { revocationDate: "2021-11-13" },
    },
  };
  expect(usNdEarlyTerminationSchema.safeParse(input).success).toBe(false);
});

test("ineligibleCriteria", () => {
  const input = {
    ...usNdEarlyTerminationFixtures.eligible.input,
    ineligibleCriteria: {
      supervisionPastEarlyDischargeDate: {
        eligibleDate: "2024-01-03",
      },
    },
  };
  expect(usNdEarlyTerminationSchema.safeParse(input)).toMatchSnapshot();
});
