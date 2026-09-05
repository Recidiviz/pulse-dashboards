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
import { caller } from "../../../../../test/US_NE/mockStaffProcedure";

const testPseudonymizedId = "test-resident-id";
const testCheckInId = "test-check-in-id";
const testAssigner = "test@example.com";

it("creates an empty Check-In", async () => {
  await caller.createCheckIn({
    pseudonymizedId: testPseudonymizedId,
    id: testCheckInId,
  });

  const checkInResult = await testPrismaClient.usNeCheckIn.findFirst({
    select: { id: true, answers: true },
    where: {
      pseudonymizedId: testPseudonymizedId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  expect(checkInResult?.id).toEqual(testCheckInId);
  expect(checkInResult?.answers).toBeEmptyObject();
});

it("does nothing if Check-In with ID already exists", async () => {
  await testPrismaClient.usNeCheckIn.create({
    data: {
      pseudonymizedId: "some-other-id",
      id: testCheckInId,
      assignedBy: testAssigner,
      answers: {},
    },
  });

  await caller.createCheckIn({
    pseudonymizedId: testPseudonymizedId,
    id: testCheckInId,
  });

  const checkInResults = await testPrismaClient.usNeCheckIn.findMany({
    select: { pseudonymizedId: true },
  });

  expect(checkInResults).toHaveLength(1);
  expect(checkInResults[0]?.pseudonymizedId).toEqual("some-other-id");
});

it("doesn't affect the resident's other Check-Ins", async () => {
  await testPrismaClient.usNeCheckIn.create({
    data: {
      pseudonymizedId: testPseudonymizedId,
      id: "some-other-id",
      assignedBy: testAssigner,
      answers: {},
    },
  });

  await caller.createCheckIn({
    pseudonymizedId: testPseudonymizedId,
    id: testCheckInId,
  });

  const checkInResults = await testPrismaClient.usNeCheckIn.findMany({
    select: { id: true },
  });

  expect(checkInResults).toHaveLength(2);
  expect(checkInResults.map((e) => e?.id)).toIncludeAllMembers([
    testCheckInId,
    "some-other-id",
  ]);
});
