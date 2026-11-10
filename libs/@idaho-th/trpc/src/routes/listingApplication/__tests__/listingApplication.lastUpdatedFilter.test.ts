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

import { describe, expect, it, vi } from "vitest";

import {
  ApplicationStage,
  ApplicationSubStage,
  TimelineViewerRole,
} from "~@idaho-th/prisma/client";
import {
  APPLICATION_FILTER_LAST_UPDATED,
  APPLICATION_RECENT_ACTIVITY_DAYS,
} from "~@idaho-th/shared";

import { buildViewerLastUpdatedWhere } from "../listingApplication.lastUpdatedFilter";

describe("buildViewerLastUpdatedWhere", () => {
  const viewer = {
    role: TimelineViewerRole.CASE_MANAGER,
    pseudonymizedId: "staff-abc",
  };

  it("returns no restriction when nothing is selected", async () => {
    const prisma = { $queryRaw: vi.fn() };

    const result = await buildViewerLastUpdatedWhere(
      prisma as never,
      viewer,
      undefined,
    );

    expect(result).toEqual({});
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("returns no restriction when ALL is selected", async () => {
    const prisma = { $queryRaw: vi.fn() };

    const result = await buildViewerLastUpdatedWhere(prisma as never, viewer, [
      APPLICATION_FILTER_LAST_UPDATED.ALL,
    ]);

    expect(result).toEqual({});
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("queries for matching application ids when UPDATED_IN_PAST_7D is selected", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: "app-1" }, { id: "app-2" }]),
    };

    const result = await buildViewerLastUpdatedWhere(prisma as never, viewer, [
      APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D,
    ]);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: { in: ["app-1", "app-2"] } });
  });

  it("matches on a lastActivityAt window rather than unread events for UPDATED_IN_PAST_7D", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([]) };
    const before = Date.now();

    await buildViewerLastUpdatedWhere(prisma as never, viewer, [
      APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D,
    ]);

    const [sqlFragment] = prisma.$queryRaw.mock.calls[0] as [
      { strings: string[]; values: unknown[] },
    ];
    const sql = sqlFragment.strings.join("");
    expect(sql).toContain('app."lastActivityAt" >=');
    expect(sql).not.toContain("TimelineReadState");

    const threshold = sqlFragment.values.find(
      (value): value is Date => value instanceof Date,
    );
    const expected = new Date(before);
    expected.setDate(expected.getDate() - APPLICATION_RECENT_ACTIVITY_DAYS);
    expect(threshold?.getTime()).toBeCloseTo(expected.getTime(), -3);
  });

  it("queries for matching application ids when NO_UPDATES_30D is selected", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: "app-3" }]),
    };

    const result = await buildViewerLastUpdatedWhere(prisma as never, viewer, [
      APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D,
    ]);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: { in: ["app-3"] } });
  });

  it("combines both buckets with a single query when both are selected", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: "app-1" }, { id: "app-3" }]),
    };

    const result = await buildViewerLastUpdatedWhere(prisma as never, viewer, [
      APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D,
      APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D,
    ]);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: { in: ["app-1", "app-3"] } });
  });

  it("scopes the query to provider-visible events for provider viewers", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
    };
    const providerViewer = {
      role: TimelineViewerRole.PROVIDER,
      pseudonymizedId: "provider-xyz",
      providerId: "provider-id-1",
    };

    await buildViewerLastUpdatedWhere(prisma as never, providerViewer, [
      APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D,
    ]);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const [sqlFragment] = prisma.$queryRaw.mock.calls[0] as [
      { strings: string[]; values: unknown[] },
    ];
    expect(sqlFragment.strings.join("")).toContain("cmOnly");
    expect(sqlFragment.values).toContain("provider-id-1");
  });

  it("scopes the raw query to the staff viewer's own applications", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([]) };

    await buildViewerLastUpdatedWhere(prisma as never, viewer, [
      APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D,
    ]);

    const [sqlFragment] = prisma.$queryRaw.mock.calls[0] as [
      { strings: string[]; values: unknown[] },
    ];
    expect(sqlFragment.strings.join("")).toContain('"StaffHousingApplication"');
    expect(sqlFragment.strings.join("")).toContain("staffPseudonymizedId");
    expect(sqlFragment.values).toContain("staff-abc");
  });

  it("scopes the raw query to the provider viewer's own applications", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([]) };
    const providerViewer = {
      role: TimelineViewerRole.PROVIDER,
      pseudonymizedId: "provider-xyz",
      providerId: "provider-id-1",
    };

    await buildViewerLastUpdatedWhere(prisma as never, providerViewer, [
      APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D,
    ]);

    const [sqlFragment] = prisma.$queryRaw.mock.calls[0] as [
      { strings: string[]; values: unknown[] },
    ];
    expect(sqlFragment.strings.join("")).toContain(
      '"ProviderHousingApplication"',
    );
    expect(sqlFragment.strings.join("")).toContain("providerId");
    expect(sqlFragment.values).toContain("provider-id-1");
  });

  describe("applications the provider was closed out of", () => {
    const providerViewer = {
      role: TimelineViewerRole.PROVIDER,
      pseudonymizedId: "provider-xyz",
      providerId: "provider-id-1",
    };

    function prismaWith(ids: string[], closedOut: string[]) {
      return {
        $queryRaw: vi.fn().mockResolvedValue(ids.map((id) => ({ id }))),
        providerHousingApplication: {
          findMany: vi
            .fn()
            .mockResolvedValue(
              closedOut.map((applicationId) => ({ applicationId })),
            ),
        },
      };
    }

    it("drops them from the bucket", async () => {
      // Both buckets read the case-wide lastActivityAt, so without this the
      // provider is matched on activity that happened after they were cut off.
      const prisma = prismaWith(["app-1", "app-2", "app-3"], ["app-2"]);

      const result = await buildViewerLastUpdatedWhere(
        prisma as never,
        providerViewer,
        [APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D],
      );

      expect(result).toEqual({ id: { in: ["app-1", "app-3"] } });
    });

    it("drops them from the stale bucket too", async () => {
      const prisma = prismaWith(["app-1", "app-2"], ["app-1", "app-2"]);

      const result = await buildViewerLastUpdatedWhere(
        prisma as never,
        providerViewer,
        [APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D],
      );

      expect(result).toEqual({ id: { in: [] } });
    });

    it("asks only about this provider, these applications, and the losing sub-stages", async () => {
      const prisma = prismaWith(["app-1"], []);

      await buildViewerLastUpdatedWhere(prisma as never, providerViewer, [
        APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D,
      ]);

      expect(prisma.providerHousingApplication.findMany).toHaveBeenCalledWith({
        where: {
          providerId: "provider-id-1",
          applicationId: { in: ["app-1"] },
          stage: ApplicationStage.CLOSED,
          subStage: {
            in: [
              ApplicationSubStage.CANCELED,
              ApplicationSubStage.NOT_SELECTED,
              ApplicationSubStage.DECLINED,
              ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
            ],
          },
        },
        select: { applicationId: true },
      });
    });

    it("keeps a match that closed as RELEASED — that provider won", async () => {
      // RELEASED is absent from the sub-stage list, so the query returns
      // nothing and the row survives.
      const prisma = prismaWith(["app-1"], []);

      const result = await buildViewerLastUpdatedWhere(
        prisma as never,
        providerViewer,
        [APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D],
      );

      expect(result).toEqual({ id: { in: ["app-1"] } });
    });

    it("never asks for a staff viewer", async () => {
      const prisma = prismaWith(["app-1"], []);

      await buildViewerLastUpdatedWhere(prisma as never, viewer, [
        APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D,
      ]);

      expect(prisma.providerHousingApplication.findMany).not.toHaveBeenCalled();
    });

    it("does not query when the raw query matched nothing", async () => {
      const prisma = prismaWith([], []);

      const result = await buildViewerLastUpdatedWhere(
        prisma as never,
        providerViewer,
        [APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D],
      );

      expect(result).toEqual({ id: { in: [] } });
      expect(prisma.providerHousingApplication.findMany).not.toHaveBeenCalled();
    });
  });
});
