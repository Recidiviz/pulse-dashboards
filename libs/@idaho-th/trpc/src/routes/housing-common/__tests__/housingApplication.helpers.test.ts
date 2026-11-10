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

import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

import { HOUSING_APPLICATION_NOT_FOUND } from "../housingApplication.errors";
import {
  buildApplicationWhereForProvider,
  buildApplicationWhereForStaff,
  lockHousingApplicationForUpdate,
  requireProviderOwnedApplication,
  requireStaffOwnsApplication,
} from "../housingApplication.helpers";

describe("buildApplicationWhereForStaff", () => {
  it("scopes by application id and staff pseudonymized id", () => {
    expect(buildApplicationWhereForStaff("app-1", "staff-1")).toEqual({
      id: "app-1",
      staffApplication: { staffPseudonymizedId: "staff-1" },
    });
  });
});

describe("buildApplicationWhereForProvider", () => {
  it("scopes by application id and active provider id", () => {
    expect(buildApplicationWhereForProvider("app-1", "org-1")).toEqual({
      id: "app-1",
      providerApplications: { some: { providerId: "org-1" } },
    });
  });
});

describe("requireStaffOwnsApplication", () => {
  it("does not throw when staff owns the application", () => {
    const context = { staffApplication: { staffPseudonymizedId: "staff-1" } };

    expect(() => requireStaffOwnsApplication(context, "staff-1")).not.toThrow();
  });

  it("throws NOT_FOUND when the application is null", () => {
    expect(() => requireStaffOwnsApplication(null, "staff-1")).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws NOT_FOUND when a different staff member owns the application", () => {
    const context = {
      staffApplication: { staffPseudonymizedId: "other-staff" },
    };

    expect(() => requireStaffOwnsApplication(context, "staff-1")).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws NOT_FOUND when staffApplication is null", () => {
    const context = { staffApplication: null };

    expect(() => requireStaffOwnsApplication(context, "staff-1")).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("requireProviderOwnedApplication", () => {
  it("returns the first provider application when present", () => {
    const providerApplications = [{ id: "provider-app-1" }];

    expect(requireProviderOwnedApplication(providerApplications)).toBe(
      providerApplications[0],
    );
  });

  it("throws NOT_FOUND when there is no provider application", () => {
    expect(() => requireProviderOwnedApplication([])).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message:
          HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("lockHousingApplicationForUpdate", () => {
  it("locks the application row when present", async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ id: "app-1" }]);
    const client = { $queryRaw: queryRaw } as never;

    await expect(
      lockHousingApplicationForUpdate(client, "app-1"),
    ).resolves.toBeUndefined();
    expect(queryRaw).toHaveBeenCalledOnce();
  });

  it("throws NOT_FOUND when the application row is missing", async () => {
    const client = {
      $queryRaw: vi.fn().mockResolvedValue([]),
    } as never;

    await expect(
      lockHousingApplicationForUpdate(client, "missing"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: HOUSING_APPLICATION_NOT_FOUND.APPLICATION,
    } satisfies Partial<TRPCError>);
  });
});
