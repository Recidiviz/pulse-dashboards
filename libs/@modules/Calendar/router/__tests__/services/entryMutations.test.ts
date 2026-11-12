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

import { Prisma } from "~@modules/Calendar/prisma";

import { classifyEntryMutationError } from "../../src/services/entryMutations";

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError("Prisma failed", {
    code,
    clientVersion: "test",
    meta,
  });
}

type MonthRow = { id: string };

/** A client whose month and entry reads return the given rows. */
function mockClient(
  month: MonthRow | null,
  entry: { id: string } | null = null,
) {
  return {
    calendarMonth: { findFirst: vi.fn().mockResolvedValue(month) },
    calendarEntry: { findFirst: vi.fn().mockResolvedValue(entry) },
  };
}

type Client = Parameters<typeof classifyEntryMutationError>[0];

const month: MonthRow = { id: "month-1" };
const context = { calendarId: "calendar-1", monthId: "month-1" };
const duplicate = { label: "Site A", date: "2026-09-14" };

async function classify(
  client: ReturnType<typeof mockClient>,
  e: unknown,
  extra: { entryId?: string; duplicate?: typeof duplicate } = {},
) {
  return classifyEntryMutationError(client as unknown as Client, e, {
    ...context,
    ...extra,
  });
}

describe("classifyEntryMutationError", () => {
  it("rethrows a TRPCError without reading anything", async () => {
    const client = mockClient(month);
    const error = new TRPCError({ code: "BAD_REQUEST" });

    await expect(classify(client, error)).rejects.toBe(error);
    expect(client.calendarMonth.findFirst).not.toHaveBeenCalled();
  });

  it("turns a duplicate entry into CONFLICT naming the label and day", async () => {
    const error = prismaError("P2002", { modelName: "CalendarEntry" });

    await expect(
      classify(mockClient(month), error, { duplicate }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Site A is already on September 14.",
    });
  });

  it.each([
    ["on another model", { modelName: "CalendarMonth" }, { duplicate }],
    ["without the add's duplicate context", { modelName: "CalendarEntry" }, {}],
  ])("rethrows a P2002 %s", async (_label, meta, extra) => {
    const error = prismaError("P2002", meta);

    await expect(classify(mockClient(month), error, extra)).rejects.toBe(error);
  });

  it("is NOT_FOUND on P2025 when the month is gone", async () => {
    const client = mockClient(null);

    await expect(classify(client, prismaError("P2025"))).rejects.toMatchObject({
      code: "NOT_FOUND",
      message:
        "That month no longer exists. Refresh to see the latest calendar.",
    });
    expect(client.calendarMonth.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "month-1", calendarId: "calendar-1" },
      }),
    );
  });

  it("is NOT_FOUND on P2025 when the entry is gone", async () => {
    await expect(
      classify(mockClient(month, null), prismaError("P2025"), {
        entryId: "entry-1",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message:
        "This entry no longer exists. Someone may have deleted it. Refresh to see the latest calendar.",
    });
  });

  it("is CONFLICT on P2025 when the entry is still there", async () => {
    await expect(
      classify(mockClient(month, { id: "entry-1" }), prismaError("P2025"), {
        entryId: "entry-1",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message:
        "Someone else changed this entry. Refresh to see the latest calendar, then try again.",
    });
  });

  it("is CONFLICT on P2025 when the month is still there and there is no entry to check", async () => {
    await expect(
      classify(mockClient(month), prismaError("P2025"), { duplicate }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message:
        "This month changed while you were saving. Refresh to see the latest calendar, then try again.",
    });
  });

  it.each([
    ["another Prisma error", prismaError("P2003")],
    ["an error that isn't Prisma's", new Error("connection reset")],
  ])("rethrows %s unchanged", async (_label, error) => {
    const client = mockClient(month);

    await expect(classify(client, error, { duplicate })).rejects.toBe(error);
    expect(client.calendarMonth.findFirst).not.toHaveBeenCalled();
  });
});
