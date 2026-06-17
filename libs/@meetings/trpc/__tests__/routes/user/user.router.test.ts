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

import { testPrismaClient, testTRPCClient } from "~@meetings/trpc/test/setup";
import { fakeStaff } from "~@meetings/trpc/test/setup/seed";

describe("user router", () => {
  describe("get", () => {
    test("returns null when user does not exist", async () => {
      const result = await testTRPCClient.v1.user.get.query();
      expect(result).toBeNull();
    });

    test("returns existing user with hasSeenOnboarding false before onboarding", async () => {
      await testPrismaClient.user.create({
        data: { email: fakeStaff[0].email },
      });

      const result = await testTRPCClient.v1.user.get.query();

      expect(result).toEqual({
        email: fakeStaff[0].email,
        hasSeenOnboarding: false,
      });
    });
  });

  describe("completeOnboarding", () => {
    test("creates user with hasSeenOnboarding true when user does not exist yet", async () => {
      await testTRPCClient.v1.user.completeOnboarding.mutate();

      const dbUser = await testPrismaClient.user.findUnique({
        where: { email: fakeStaff[0].email },
      });
      expect(dbUser?.hasSeenOnboarding).toBe(true);
    });

    test("sets hasSeenOnboarding to true for existing user", async () => {
      await testPrismaClient.user.create({
        data: { email: fakeStaff[0].email },
      });

      await testTRPCClient.v1.user.completeOnboarding.mutate();

      const dbUser = await testPrismaClient.user.findUnique({
        where: { email: fakeStaff[0].email },
      });
      expect(dbUser?.hasSeenOnboarding).toBe(true);
    });

    test("get returns hasSeenOnboarding true after onboarding is completed", async () => {
      await testTRPCClient.v1.user.completeOnboarding.mutate();

      const result = await testTRPCClient.v1.user.get.query();
      expect(result?.hasSeenOnboarding).toBe(true);
    });
  });
});
