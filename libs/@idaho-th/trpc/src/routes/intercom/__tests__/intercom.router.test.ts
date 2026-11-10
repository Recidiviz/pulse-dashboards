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

import { describe, expect, it } from "vitest";

import { INTERCOM_EXTERNAL_ID_NAMESPACE } from "~@idaho-th/trpc/intercom/intercom.constants";
import {
  anonymousCaller,
  providerCaller,
  staffCaller,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import { seedProviderUserWithHousingProviders } from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

describe("intercomRouter.getMessengerAuthForStaff", () => {
  it("returns the namespaced staff external_id", async () => {
    const result = await staffCaller().intercom.getMessengerAuthForStaff();

    expect(result.userId).toBe(
      `${INTERCOM_EXTERNAL_ID_NAMESPACE.STAFF}:${TEST_STAFF_PSEUDONYMIZED_ID}`,
    );
  });

  it("rejects an unauthenticated caller", async () => {
    await expect(
      anonymousCaller().intercom.getMessengerAuthForStaff(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a provider caller", async () => {
    await expect(
      providerCaller().intercom.getMessengerAuthForStaff(),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a staff caller with no pseudonymized id", async () => {
    await expect(
      staffCaller({
        staffPseudonymizedId: undefined,
      }).intercom.getMessengerAuthForStaff(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("intercomRouter.getMessengerAuthForProvider", () => {
  it("returns the namespaced provider external_id", async () => {
    const { user } = await seedProviderUserWithHousingProviders(
      testPrismaClient,
      { user: { pseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID } },
    );

    const result =
      await providerCaller().intercom.getMessengerAuthForProvider();

    expect(result.userId).toBe(
      `${INTERCOM_EXTERNAL_ID_NAMESPACE.PROVIDER}:${user.id}`,
    );
  });

  it("rejects an unauthenticated caller", async () => {
    await expect(
      anonymousCaller().intercom.getMessengerAuthForProvider(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a staff caller", async () => {
    await expect(
      staffCaller().intercom.getMessengerAuthForProvider(),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a provider caller with no pseudonymized id", async () => {
    await expect(
      providerCaller({
        providerPseudonymizedId: undefined,
      }).intercom.getMessengerAuthForProvider(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
