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
} from "~@idaho-th/prisma/client";
import type { PaginationParams } from "~@idaho-th/trpc/utils/pagination";

import type { ListApplicationRecordsConfig } from "../applicationRecordQuery";
import {
  buildClosedCaseDashboardVisibilityWhere,
  listApplicationRecords,
} from "../applicationRecordQuery";

function makeConfig() {
  const findMany = vi.fn().mockResolvedValue([]);
  const count = vi.fn().mockResolvedValue(0);
  const config: ListApplicationRecordsConfig = {
    prismaModel: { count, findMany },
    include: { application: true },
  };
  return { config, count, findMany };
}

const pagination: PaginationParams = { pageSize: 7 };

describe("buildClosedCaseDashboardVisibilityWhere", () => {
  const now = new Date("2026-07-06T12:00:00.000Z");
  const visibilityStart = new Date("2026-06-29T12:00:00.000Z");

  it("shows non-closed stages and recently closed cases", () => {
    expect(buildClosedCaseDashboardVisibilityWhere(now)).toEqual({
      OR: [
        { stage: { not: ApplicationStage.CLOSED } },
        { updatedAt: { gte: visibilityStart } },
        {
          AND: [
            { stage: ApplicationStage.CLOSED },
            { subStage: ApplicationSubStage.RELEASED },
            {
              application: {
                expectedReleaseDate: { gte: visibilityStart },
              },
            },
          ],
        },
      ],
    });
  });
});

describe("listApplicationRecords search filtering", () => {
  it("filters by a self-located search field only", async () => {
    const { config, findMany } = makeConfig();

    await listApplicationRecords(config, {
      where: { stateCode: "ID" },
      search: { status: { contains: "wait", mode: "insensitive" } },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { stateCode: "ID" },
            { status: { contains: "wait", mode: "insensitive" } },
          ],
        },
      }),
    );
  });

  it("filters by an application-located search field only", async () => {
    const { config, findMany } = makeConfig();

    await listApplicationRecords(config, {
      where: { stateCode: "ID" },
      search: { clientName: { contains: "smith", mode: "insensitive" } },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { stateCode: "ID" },
            {
              application: {
                is: {
                  clientName: { contains: "smith", mode: "insensitive" },
                },
              },
            },
          ],
        },
      }),
    );
  });

  it("combines self and application-located search fields with AND", async () => {
    const { config, findMany } = makeConfig();

    await listApplicationRecords(config, {
      where: { stateCode: "ID" },
      search: {
        status: { contains: "wait", mode: "insensitive" },
        clientName: { contains: "smith", mode: "insensitive" },
      },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { stateCode: "ID" },
            {
              AND: [
                { status: { contains: "wait", mode: "insensitive" } },
                {
                  application: {
                    is: {
                      clientName: { contains: "smith", mode: "insensitive" },
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    );
  });

  it("ignores search fields that aren't in APPLICATION_RECORD_FIELDS", async () => {
    const { config, findMany } = makeConfig();

    await listApplicationRecords(config, {
      where: { stateCode: "ID" },
      search: { unknownField: { contains: "x", mode: "insensitive" } },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stateCode: "ID" } }),
    );
  });
});

describe("listApplicationRecords applicationWhere filtering", () => {
  it("nests applicationWhere filters under the application relation", async () => {
    const { config, findMany } = makeConfig();
    const gte = new Date("2026-07-01T00:00:00.000Z");

    await listApplicationRecords(config, {
      where: { stateCode: "ID" },
      applicationWhere: { expectedReleaseDate: { gte } },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { stateCode: "ID" },
            { application: { is: { expectedReleaseDate: { gte } } } },
          ],
        },
      }),
    );
  });
});

describe("listApplicationRecords sorting", () => {
  it("falls back to the default sort field and direction for an unrecognized field", async () => {
    const { config, findMany } = makeConfig();

    await listApplicationRecords(config, {
      where: {},
      sorting: { field: "notARealField", direction: "desc" },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { application: { expectedReleaseDate: "asc" } },
          { id: "asc" },
        ],
      }),
    );
  });

  it("sorts by a valid application-located field", async () => {
    const { config, findMany } = makeConfig();

    await listApplicationRecords(config, {
      where: {},
      sorting: { field: "createdAt", direction: "desc" },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ application: { createdAt: "desc" } }, { id: "desc" }],
      }),
    );
  });

  it("sorts by a valid self-located field", async () => {
    const { config, findMany } = makeConfig();

    await listApplicationRecords(config, {
      where: {},
      sorting: { field: "status", direction: "desc" },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ status: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("sorts by a self-located field aliased to a different column", async () => {
    const { config, findMany } = makeConfig();

    await listApplicationRecords(config, {
      where: {},
      sorting: { field: "dateReceived", direction: "desc" },
      pagination,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });
});
