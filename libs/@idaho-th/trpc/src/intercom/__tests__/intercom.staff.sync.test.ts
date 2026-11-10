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

import { beforeEach, describe, expect, it, vi } from "vitest";

const isTokenConfiguredMock = vi.hoisted(() => vi.fn(() => true));
const upsertHousingStaffRowMock = vi.hoisted(() => vi.fn());
const setStaffIntercomSyncMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/intercom/intercom.config", () => ({
  isIntercomTokenConfigured: isTokenConfiguredMock,
}));

vi.mock("~@idaho-th/trpc/intercom/intercom.helper", () => ({
  upsertHousingStaffRow: upsertHousingStaffRowMock,
  setStaffIntercomSync: setStaffIntercomSyncMock,
}));

import { upsertStaffAndSyncIntercom } from "~@idaho-th/trpc/intercom/intercom.staff.sync";

beforeEach(() => {
  vi.clearAllMocks();
  isTokenConfiguredMock.mockReturnValue(true);
});

describe("upsertStaffAndSyncIntercom", () => {
  it("returns conflict without calling Intercom", async () => {
    upsertHousingStaffRowMock.mockResolvedValue({
      status: "conflict",
      existingPseudonymizedId: "other",
    });

    await expect(
      upsertStaffAndSyncIntercom({
        prisma: {} as never,
        email: "a@b.com",
        pseudonymizedId: "staff-1",
      }),
    ).resolves.toEqual({
      status: "conflict",
      existingPseudonymizedId: "other",
    });
  });

  it("skips Intercom when already synced and email unchanged", async () => {
    upsertHousingStaffRowMock.mockResolvedValue({
      status: "updated",
      emailChanged: false,
      staff: {
        id: "s1",
        email: "a@b.com",
        pseudonymizedId: "staff-1",
        intercomContactId: "ic-1",
        intercomSyncedAt: new Date(),
      },
    });

    await expect(
      upsertStaffAndSyncIntercom({
        prisma: {} as never,
        email: "a@b.com",
        pseudonymizedId: "staff-1",
        upsertContact: vi.fn(),
      }),
    ).resolves.toMatchObject({
      status: "skipped",
      staffId: "s1",
      contactId: "ic-1",
    });
  });

  it("fail-opens when Intercom upsert throws after DB success", async () => {
    upsertHousingStaffRowMock.mockResolvedValue({
      status: "created",
      emailChanged: true,
      staff: {
        id: "s1",
        email: "a@b.com",
        pseudonymizedId: "staff-1",
        intercomContactId: null,
        intercomSyncedAt: null,
      },
    });

    await expect(
      upsertStaffAndSyncIntercom({
        prisma: {} as never,
        email: "a@b.com",
        pseudonymizedId: "staff-1",
        upsertContact: vi.fn().mockRejectedValue(new Error("down")),
      }),
    ).resolves.toEqual({
      status: "failed",
      staffId: "s1",
      pseudonymizedId: "staff-1",
      // A plain Error carries no Intercom code, so it reports as unknown.
      code: "unknown_error",
    });
    expect(setStaffIntercomSyncMock).not.toHaveBeenCalled();
  });

  it("persists contact id after successful Intercom upsert", async () => {
    upsertHousingStaffRowMock.mockResolvedValue({
      status: "created",
      emailChanged: true,
      staff: {
        id: "s1",
        email: "a@b.com",
        pseudonymizedId: "staff-1",
        intercomContactId: null,
        intercomSyncedAt: null,
      },
    });
    const upsertContact = vi.fn().mockResolvedValue({
      status: "created",
      contactId: "ic-9",
    });

    await expect(
      upsertStaffAndSyncIntercom({
        prisma: {} as never,
        email: "a@b.com",
        pseudonymizedId: "staff-1",
        upsertContact,
      }),
    ).resolves.toMatchObject({
      status: "created",
      contactId: "ic-9",
    });

    expect(setStaffIntercomSyncMock).toHaveBeenCalledWith(
      {},
      "s1",
      expect.objectContaining({ intercomContactId: "ic-9" }),
    );
  });
});
