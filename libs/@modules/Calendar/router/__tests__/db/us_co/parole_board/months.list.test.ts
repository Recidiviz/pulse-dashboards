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

import { TRPCClientError } from "@trpc/client";
import { z } from "zod";

import { addMonths, YearMonth } from "~@modules/Calendar/rules";

import type { MonthListPage } from "../../../../src/types";
import { listMonthsInput } from "../../../../src/us_co/parole_board/schema";
import { testPrismaClient } from "../../../setup";
import { AUDIT_EMAIL, OTHER_CALENDAR_CODE } from "../../../setup/fixtures";
import { coEditor, recidivizUser } from "../../../setup/users";
import { initUsCoClient } from "../../../us_co/parole_board/setup";

const calendarCode = "PAROLE_BOARD_PUBLIC";

async function calendarId(code: string): Promise<string> {
  const calendar = await testPrismaClient.calendar.findUniqueOrThrow({
    where: { code },
  });
  return calendar.id;
}

/** Creates `count` consecutive months from `start` in the calendar with `code`. */
async function createMonths(
  code: string,
  start: YearMonth,
  count: number,
  updatedByEmail = AUDIT_EMAIL,
): Promise<void> {
  const id = await calendarId(code);
  await testPrismaClient.calendarMonth.createMany({
    data: Array.from({ length: count }, (_, i) => ({
      calendarId: id,
      ...addMonths(start, i),
      createdByEmail: AUDIT_EMAIL,
      updatedByEmail,
    })),
  });
}

function keys(page: MonthListPage): string[] {
  return page.items.map((m) => `${m.year}-${String(m.month).padStart(2, "0")}`);
}

type ListInput = z.input<typeof listMonthsInput>;

async function list(input: Omit<ListInput, "calendarCode">) {
  const client = await initUsCoClient(coEditor);
  return client.Calendar.usCo.paroleBoard.admin.months.list.query(input);
}

/**
 * Follows a page's cursor in one direction until the last page, and returns
 * every page in ascending order.
 */
async function walk(
  direction: "backward" | "forward",
  cursor?: YearMonth,
): Promise<MonthListPage[]> {
  const page = await list({ limit: 7, direction, cursor });
  const next = direction === "backward" ? page.prevCursor : page.nextCursor;
  if (!next) return [page];
  const rest = await walk(direction, next);
  return direction === "backward" ? [...rest, page] : [page, ...rest];
}

/**
 * Sets the clock (Date only, so the server's own timers keep running). The
 * test calendar's timezone is America/Denver.
 */
function setNow(iso: string): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

// months.list leaves out months before the current one. Every test starts in
// January 2025, before the first month any of them creates, so all their
// months are listed unless a test moves the clock.
beforeEach(() => setNow("2025-01-15T12:00:00Z"));
afterEach(() => vi.useRealTimers());

describe("Calendar.usCo.paroleBoard.admin.months.list paging", () => {
  // 30 months, January 2025 to June 2027.
  beforeEach(() => createMonths(calendarCode, { year: 2025, month: 1 }, 30));

  it("starts at the newest 24 months by default", async () => {
    const page = await list({});

    expect(page.items).toHaveLength(24);
    expect(keys(page)[0]).toBe("2025-07");
    expect(keys(page).at(-1)).toBe("2027-06");
    expect(page.prevCursor).toEqual({ year: 2025, month: 7 });
    expect(page.nextCursor).toBeNull();
  });

  it("walks older pages to the first month without gaps or repeats", async () => {
    const pages = await walk("backward");

    const all = pages.flatMap(keys);
    expect(all).toHaveLength(30);
    expect(new Set(all).size).toBe(30);
    expect(all[0]).toBe("2025-01");
    expect(keys(pages[0])).toEqual(["2025-01", "2025-02"]);
    expect(pages[0].nextCursor).toEqual({ year: 2025, month: 2 });
  });

  it("walks newer pages from the oldest month to the newest", async () => {
    const pages = await walk("forward");
    expect(pages[0].prevCursor).toBeNull();

    const all = pages.flatMap(keys);
    expect(all).toHaveLength(30);
    expect(new Set(all).size).toBe(30);
    expect(all.at(-1)).toBe("2027-06");
    expect(pages.at(-1)?.prevCursor).toEqual({ year: 2027, month: 5 });
  });

  it("returns an empty page past either end", async () => {
    expect(
      await list({ direction: "backward", cursor: { year: 2025, month: 1 } }),
    ).toEqual({ items: [], prevCursor: null, nextCursor: null });
    expect(
      await list({ direction: "forward", cursor: { year: 2027, month: 6 } }),
    ).toEqual({ items: [], prevCursor: null, nextCursor: null });
  });

  it("centres a page on the given month", async () => {
    const page = await list({ limit: 6, around: { year: 2026, month: 6 } });

    expect(keys(page)).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(page.prevCursor).toEqual({ year: 2026, month: 3 });
    expect(page.nextCursor).toEqual({ year: 2026, month: 8 });
  });

  it("fills a page centred near the newest month from older months", async () => {
    const page = await list({ limit: 6, around: { year: 2027, month: 5 } });

    expect(keys(page)).toEqual([
      "2027-01",
      "2027-02",
      "2027-03",
      "2027-04",
      "2027-05",
      "2027-06",
    ]);
    expect(page.nextCursor).toBeNull();
  });

  it("fills a page centred near the oldest month from newer months", async () => {
    const page = await list({ limit: 6, around: { year: 2025, month: 2 } });

    expect(keys(page)).toEqual([
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
      "2025-05",
      "2025-06",
    ]);
    expect(page.prevCursor).toBeNull();
    expect(page.nextCursor).toEqual({ year: 2025, month: 6 });
  });

  it("puts the extra month of an odd limit from the centre onwards", async () => {
    const page = await list({ limit: 5, around: { year: 2026, month: 6 } });

    expect(keys(page)).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
  });

  it("centres on a month that has no row", async () => {
    const page = await list({ limit: 4, around: { year: 2030, month: 1 } });

    expect(keys(page)).toEqual(["2027-03", "2027-04", "2027-05", "2027-06"]);
    expect(page.prevCursor).toEqual({ year: 2027, month: 3 });
    expect(page.nextCursor).toBeNull();
  });

  it("follows the cursor and ignores around on a later page", async () => {
    const first = await list({ limit: 4, around: { year: 2026, month: 6 } });
    const next = await list({
      limit: 4,
      around: { year: 2026, month: 6 },
      direction: "forward",
      cursor: first.nextCursor ?? undefined,
    });
    const previous = await list({
      limit: 4,
      around: { year: 2026, month: 6 },
      direction: "backward",
      cursor: first.prevCursor ?? undefined,
    });

    expect(keys(first)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07"]);
    expect(keys(next)).toEqual(["2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(keys(previous)).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
  });

  it("returns at most 100 months", async () => {
    await createMonths(calendarCode, { year: 2030, month: 1 }, 90);

    const page = await list({ limit: 100 });

    expect(page.items).toHaveLength(100);
    expect(page.prevCursor).toEqual({ year: 2026, month: 9 });
  });

  it("rejects a limit over 100", async () => {
    await expect(list({ limit: 101 })).rejects.toSatisfy(
      (e) => e instanceof TRPCClientError && e.data?.code === "BAD_REQUEST",
    );
  });
});

describe("Calendar.usCo.paroleBoard.admin.months.list past months", () => {
  // January 2026 to December 2026.
  beforeEach(() => createMonths(calendarCode, { year: 2026, month: 1 }, 12));

  it("starts at the current month in the calendar's timezone", async () => {
    // 05:30 UTC on October 1 is still September 30 in Denver.
    setNow("2026-10-01T05:30:00Z");
    expect(keys(await list({}))).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);

    setNow("2026-10-01T06:30:00Z");
    const page = await list({});
    expect(keys(page)).toEqual(["2026-10", "2026-11", "2026-12"]);
    expect(page.prevCursor).toBeNull();
  });

  it("has no older page and no past months around or before the current month", async () => {
    setNow("2026-10-15T12:00:00Z");

    expect(keys(await list({ around: { year: 2026, month: 3 } }))).toEqual([
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
    const older = await list({
      direction: "backward",
      cursor: { year: 2026, month: 11 },
    });
    expect(keys(older)).toEqual(["2026-10"]);
    expect(older.prevCursor).toBeNull();
    expect(keys(await list({ search: "March 2026" }))).toEqual([]);
  });
});

describe("Calendar.usCo.paroleBoard.admin.months.list search", () => {
  // 30 months, January 2025 to June 2027.
  beforeEach(() => createMonths(calendarCode, { year: 2025, month: 1 }, 30));

  it.each([
    ["2026", 12, "2026-01", "2026-12"],
    ["Oct", 2, "2025-10", "2026-10"],
    ["  OCTOBER ", 2, "2025-10", "2026-10"],
    ["October 2026", 1, "2026-10", "2026-10"],
    ["oct, 2026", 1, "2026-10", "2026-10"],
    ["10/2026", 1, "2026-10", "2026-10"],
  ])("finds %s", async (search, count, firstKey, lastKey) => {
    const page = await list({ search });

    expect(page.items).toHaveLength(count);
    expect(keys(page)[0]).toBe(firstKey);
    expect(keys(page).at(-1)).toBe(lastKey);
  });

  it("pages within the search results", async () => {
    const first = await list({
      search: "2026",
      direction: "forward",
      limit: 5,
    });
    const second = await list({
      search: "2026",
      direction: "forward",
      limit: 5,
      cursor: first.nextCursor ?? undefined,
    });

    expect(keys(first)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
    expect(keys(second)[0]).toBe("2026-06");
    expect(second.prevCursor).toEqual({ year: 2026, month: 6 });
  });

  it("centres within the search results", async () => {
    const page = await list({
      search: "Jan",
      limit: 2,
      around: { year: 2026, month: 1 },
    });

    expect(keys(page)).toEqual(["2025-01", "2026-01"]);
    expect(page.nextCursor).toEqual({ year: 2026, month: 1 });
  });

  it.each(["Octember", "13/2026", "20", "October 26", "2026 2027"])(
    "returns no months for %s",
    async (search) => {
      expect(await list({ search })).toEqual({
        items: [],
        prevCursor: null,
        nextCursor: null,
      });
    },
  );

  it("returns no months for a year with none", async () => {
    expect((await list({ search: "2031" })).items).toEqual([]);
  });
});

describe("Calendar.usCo.paroleBoard.admin.months.list calendar isolation", () => {
  beforeEach(async () => {
    await createMonths(
      calendarCode,
      { year: 2026, month: 1 },
      6,
      "co-editor@example.com",
    );
    await createMonths(
      OTHER_CALENDAR_CODE,
      { year: 2025, month: 7 },
      18,
      "id-editor@example.com",
    );
  });

  it.each([
    ["the first page", {}],
    [
      "a newer page",
      { direction: "forward" as const, cursor: { year: 2025, month: 1 } },
    ],
    [
      "an older page",
      { direction: "backward" as const, cursor: { year: 2027, month: 1 } },
    ],
    ["a centred page", { around: { year: 2026, month: 12 } }],
    ["a search", { search: "2026" }],
  ])(
    "never shows a US_CO editor another calendar's month in %s",
    async (_label, input) => {
      const page = await list(input);

      expect(page.items).toHaveLength(6);
      expect(new Set(page.items.map((m) => m.lastEditedByEmail))).toEqual(
        new Set(["co-editor@example.com"]),
      );
      expect(page.prevCursor).toBeNull();
      expect(page.nextCursor).toBeNull();
    },
  );

  it("shows a Recidiviz user, who may act in any state, only US_CO's months", async () => {
    const client = await initUsCoClient(recidivizUser);

    const page = await client.Calendar.usCo.paroleBoard.admin.months.list.query(
      {},
    );

    expect(page.items).toHaveLength(6);
    expect(new Set(page.items.map((m) => m.lastEditedByEmail))).toEqual(
      new Set(["co-editor@example.com"]),
    );
  });
});
