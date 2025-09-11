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
import {
  mswServer,
  processingStatusHandler,
} from "~@reentry/trpc/test/setup/msw";
import { fakeClient, fakeStaff } from "~@reentry/trpc/test/setup/seed";

describe("staff router", () => {
  beforeAll(() => {
    process.env["V0_API_URL"] =
      (process.env["V0_API_URL"] || "http://test-api") + "/clients";
    mswServer.listen({ onUnhandledRequest: "warn" });
  });

  afterEach(() => {
    mswServer.resetHandlers();
  });

  afterAll(() => {
    mswServer.close();
  });

  describe("getClientIntakeStatus", () => {
    test("returns 'new' when intake is not enabled and there is no intake", async () => {
      // Ensure client has no Intake records
      await testPrismaClient.intake.deleteMany({
        where: { client: { pseudonymizedId: fakeClient.pseudonymizedId } },
      });
      await testPrismaClient.client.update({
        where: { pseudonymizedId: fakeClient.pseudonymizedId },
        data: { intakeEnabled: false },
      });

      const status = await testTRPCClient.staff.getClientIntakeStatus.query({
        clientPseudoId: fakeClient.pseudonymizedId,
        staffPseudoId: fakeStaff.pseudonymizedId,
      });
      expect(status).toBe("new");
    });

    test("returns 'intake_enabled' when intake is enabled and there is no intake", async () => {
      // Ensure client has no Intake records
      await testPrismaClient.intake.deleteMany({
        where: { client: { pseudonymizedId: fakeClient.pseudonymizedId } },
      });
      await testTRPCClient.staff.toggleIntake.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        enable: true,
      });

      const status = await testTRPCClient.staff.getClientIntakeStatus.query({
        clientPseudoId: fakeClient.pseudonymizedId,
        staffPseudoId: fakeStaff.pseudonymizedId,
      });
      expect(status).toBe("intake_enabled");
    });

    test("returns 'intake_in_progress' when intake is enabled and there is no intake", async () => {
      await testTRPCClient.staff.toggleIntake.mutate({
        clientPseudoId: fakeClient.pseudonymizedId,
        enable: true,
      });

      const status = await testTRPCClient.staff.getClientIntakeStatus.query({
        clientPseudoId: fakeClient.pseudonymizedId,
        staffPseudoId: fakeStaff.pseudonymizedId,
      });
      expect(status).toBe("intake_in_progress");
    });

    test("returns external 'in_progress' status when fetchProcessingStatus is not 'unknown' or 'not_started'", async () => {
      mswServer.use(processingStatusHandler("in_progress"));

      const result = await testTRPCClient.staff.getAllClientsIntakeStatus.query(
        {
          staffPseudoId: fakeStaff.pseudonymizedId,
        },
      );

      expect(result[fakeClient.pseudonymizedId]).toBe("in_progress");
    });
  });

  describe("getAllClientsIntakeStatus", () => {
    test("returns an empty map for a staffId with no clients", async () => {
      const result = await testTRPCClient.staff.getAllClientsIntakeStatus.query(
        {
          staffPseudoId: "999999",
        },
      );
      expect(result).toEqual({});
    });

    test("returns correct statuses for multiple clients", async () => {
      // Create two clients under the same staff w/ no intakes
      await testPrismaClient.client.create({
        data: {
          ...fakeClient,
          personId: 2,
          pseudonymizedId: "client-pid-2",
          stablePersonExternalId: "client-ext-2a",
          displayPersonExternalId: "client-display-ext-2a",
          staff: { create: { staffId: fakeStaff.staffId } },
        },
      });
      await testPrismaClient.client.create({
        data: {
          ...fakeClient,
          personId: 3,
          pseudonymizedId: "client-pid-3",
          stablePersonExternalId: "client-ext-3a",
          displayPersonExternalId: "client-display-ext-3a",
          staff: { create: { staffId: fakeStaff.staffId } },
        },
      });

      const result = await testTRPCClient.staff.getAllClientsIntakeStatus.query(
        {
          staffPseudoId: fakeStaff.pseudonymizedId,
        },
      );

      expect(result).toEqual({
        "client-pid-1": "intake_in_progress",
        "client-pid-2": "new",
        "client-pid-3": "new",
      });
    });
  });
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
      ).rejects.toThrow(/Client not found/);
    });
  });
});
