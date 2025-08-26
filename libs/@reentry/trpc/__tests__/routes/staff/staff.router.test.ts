// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { testPrismaClient, testTRPCClient } from "~@reentry/trpc/test/setup";
import { fakeClient } from "~@reentry/trpc/test/setup/seed";

describe("staff router", () => {
  describe("getIntakeEnabled", () => {
    test("returns intake status for an existing client", async () => {
      const result = await testTRPCClient.staff.getIntakeEnabled.query({
        clientPseudoId: fakeClient.pseudonymizedId,
      });
      expect(result).toEqual({ intakeEnabled: false });

      await testTRPCClient.staff.toggleIntake.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        enable: true,
      });

      const updated = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { intakeEnabled: true },
      });
      expect(updated?.intakeEnabled).toBe(true);
    });
  });

  describe("toggleIntake", () => {
    test("enables intake for an existing client", async () => {
      await testPrismaClient.client.update({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        data: { intakeEnabled: false },
      });

      await testTRPCClient.staff.toggleIntake.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        enable: true,
      });

      const updated = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { intakeEnabled: true },
      });
      expect(updated?.intakeEnabled).toBe(true);
    });

    test("disables intake for an existing client", async () => {
      await testPrismaClient.client.update({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        data: { intakeEnabled: true },
      });

      await testTRPCClient.staff.toggleIntake.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        enable: false,
      });

      const updated = await testPrismaClient.client.findUnique({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        select: { intakeEnabled: true },
      });
      expect(updated?.intakeEnabled).toBe(false);
    });

    test("throws error when the client is missing", async () => {
      await expect(
        testTRPCClient.staff.toggleIntake.mutate({
          clientPseudoId: "missing-client",
          enable: true,
        }),
      ).rejects.toThrow("Client not found");
    });
  });
});
