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

import { HOUSING_APPLICATION_NOT_FOUND } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";

import {
  getProviderApplicationById,
  getStaffApplicationById,
} from "../applicationDetail.service";
import {
  applicationId,
  buildProviderJoinedApplicationRow,
  buildStaffJoinedApplicationRow,
  providerApplicationId,
  staffPseudonymizedId,
  testApplication,
} from "./applicationDetail.testFixtures";

describe("applicationDetail.service", () => {
  it("uses a single joined read for staff detail", async () => {
    const housingApplicationFindFirst = vi
      .fn()
      .mockResolvedValue(buildStaffJoinedApplicationRow());
    const prisma = {
      housingApplication: { findFirst: housingApplicationFindFirst },
      staffHousingApplication: { findFirst: vi.fn() },
    };

    const detail = await getStaffApplicationById(
      prisma as never,
      staffPseudonymizedId,
      applicationId,
    );

    expect(housingApplicationFindFirst).toHaveBeenCalledTimes(1);
    expect(prisma.staffHousingApplication.findFirst).not.toHaveBeenCalled();
    expect(detail.clientName).toBe(testApplication.clientName);
    expect(detail.idocNumber).toBe("123456");
  });

  it("rejects staff who do not own the application", async () => {
    const prisma = {
      housingApplication: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    await expect(
      getStaffApplicationById(
        prisma as never,
        staffPseudonymizedId,
        applicationId,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  it("uses a single joined read for provider detail", async () => {
    const housingApplicationFindFirst = vi
      .fn()
      .mockResolvedValue(buildProviderJoinedApplicationRow());
    const prisma = {
      housingApplication: { findFirst: housingApplicationFindFirst },
      providerHousingApplication: { findFirst: vi.fn() },
    };

    const detail = await getProviderApplicationById(
      prisma as never,
      "provider-xyz",
      applicationId,
    );

    expect(housingApplicationFindFirst).toHaveBeenCalledTimes(1);
    expect(prisma.providerHousingApplication.findFirst).not.toHaveBeenCalled();
    expect(detail.providerApplicationId).toBe(providerApplicationId);
    expect(detail.clientName).toBe(testApplication.clientName);
  });

  it("rejects providers who do not own the application", async () => {
    const prisma = {
      housingApplication: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    await expect(
      getProviderApplicationById(
        prisma as never,
        "provider-xyz",
        applicationId,
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message:
          HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      } satisfies Partial<TRPCError>),
    );
  });
});
