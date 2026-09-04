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

import { testPrismaClient } from "../../../../../test/prisma";
import {
  checkboxAnswers,
  lifeAreaAnswers,
  textAnswers,
} from "../../../../../test/US_NC/fixtures/rna";
import { caller } from "../../../../../test/US_NC/mockStaffProcedure";

const testResidentId = "abc123";
const testCompletionDate = new Date(2026, 1, 1);

test("no result", async () => {
  await expect(
    caller.getRNA({ pseudonymizedId: testResidentId }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[TRPCError: No assessment data could be found for this resident (ID: abc123)]`,
  );
});

test("completed assessment", async () => {
  await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      answers: {
        ...textAnswers,
        ...lifeAreaAnswers,
        ...checkboxAnswers,
      },
      completedAt: testCompletionDate,
    },
  });

  const result = await caller.getRNA({ pseudonymizedId: testResidentId });
  expect(result).toEqual({
    status: "COMPLETE",
    textAnswers,
    checkboxAnswers,
    lifeAreaAnswers,
    id: expect.any(String),
    submittedByStaffAt: null,
  });
});

test("in progress assessment", async () => {
  await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      // this is not entirely realistic, what matters is that it's not empty
      answers: {
        ...lifeAreaAnswers,
      },
    },
  });

  const result = await caller.getRNA({ pseudonymizedId: testResidentId });
  expect(result).toEqual({
    status: "IN_PROGRESS",
    lifeAreaAnswers,
    checkboxAnswers: {},
    textAnswers: {},
    id: expect.any(String),
    submittedByStaffAt: null,
  });
});

test("not started assessment", async () => {
  await testPrismaClient.usNcRNA.create({
    data: {
      pseudonymizedId: testResidentId,
      answers: {},
    },
  });

  const result = await caller.getRNA({ pseudonymizedId: testResidentId });
  expect(result).toEqual({
    status: "NOT_STARTED",
    checkboxAnswers: {},
    textAnswers: {},
    lifeAreaAnswers: {},
    id: expect.any(String),
    submittedByStaffAt: null,
  });
});
