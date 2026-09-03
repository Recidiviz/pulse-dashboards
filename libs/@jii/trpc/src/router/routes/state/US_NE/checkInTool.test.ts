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

import {
  caller,
  mockCtx,
  testPseudonymizedId,
} from "../../../../test/mockStateProcedure";
import { testPrismaClient } from "../../../../test/prisma";

const testCheckInId = "test-check-in-id";
const testEmail = "test@example.com";

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.setSystemTime("2022-02-02");
  mockCtx.stateCode = "US_NE";
});

describe("getCheckIn", () => {
  it("returns null if no check-in", async () => {
    await expect(
      caller.usNe.getCheckIn({ pseudonymizedId: testPseudonymizedId }),
    ).resolves.toBeNull();
  });

  it("returns one check-in", async () => {
    await testPrismaClient.usNeCheckIn.create({
      data: {
        id: testCheckInId,
        pseudonymizedId: testPseudonymizedId,
        assignedBy: testEmail,
        answers: {},
      },
    });

    await expect(
      caller.usNe.getCheckIn({ pseudonymizedId: testPseudonymizedId }),
    ).resolves.toMatchObject({ id: testCheckInId });
  });

  it("returns most recent check-in", async () => {
    vi.setSystemTime(new Date("2020-01-01"));

    await testPrismaClient.usNeCheckIn.create({
      data: {
        id: "another-check-in-id",
        pseudonymizedId: testPseudonymizedId,
        assignedBy: testEmail,
        answers: {},
      },
    });

    vi.setSystemTime(new Date("2025-05-05"));

    await testPrismaClient.usNeCheckIn.create({
      data: {
        id: testCheckInId,
        pseudonymizedId: testPseudonymizedId,
        assignedBy: testEmail,
        answers: {},
      },
    });

    await expect(
      caller.usNe.getCheckIn({ pseudonymizedId: testPseudonymizedId }),
    ).resolves.toMatchObject({ id: testCheckInId });
  });
});

describe("updateCheckIn", () => {
  it("throws error if check-in doesn't exist", async () => {
    await expect(
      caller.usNe.updateCheckIn({
        id: testCheckInId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCError: Check-In with ID test-check-in-id not found]`,
    );
  });

  it("throws error if check-in doesn't match input pseudo ID", async () => {
    await testPrismaClient.usNeCheckIn.create({
      data: {
        id: testCheckInId,
        pseudonymizedId: "another-different-pseudo-id",
        assignedBy: testEmail,
        answers: {},
      },
    });

    await expect(
      caller.usNe.updateCheckIn({
        id: testCheckInId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCError: Resident test-resident-id cannot update another person's Check-In (Check-In ID: test-check-in-id)]`,
    );
  });

  it("updates all answers of check-in", async () => {
    await testPrismaClient.usNeCheckIn.create({
      data: {
        id: testCheckInId,
        pseudonymizedId: testPseudonymizedId,
        assignedBy: testEmail,
        answers: { foo: "bar", baz: 123 },
      },
    });

    await caller.usNe.updateCheckIn({
      id: testCheckInId,
      pseudonymizedId: testPseudonymizedId,
      answers: { foo: "different answer" },
    });

    await expect(
      caller.usNe.getCheckIn({ pseudonymizedId: testPseudonymizedId }),
    ).resolves.toMatchObject({ answers: { foo: "different answer" } });
  });
});
