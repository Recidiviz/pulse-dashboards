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

import { TRPCClient, TRPCClientError } from "@trpc/client";

import { MIN_YEAR } from "~@modules/Calendar/rules";

import { coEditor } from "../../../setup/users";
import {
  initUsCoClient,
  type usCoTestRouter,
} from "../../../us_co/parole_board/setup";

type Client = TRPCClient<typeof usCoTestRouter>;

async function codeOf(call: Promise<unknown>): Promise<string> {
  try {
    await call;
    return "OK";
  } catch (e) {
    if (e instanceof TRPCClientError) return e.data?.code;
    throw e;
  }
}

/**
 * An invalid input returns BAD_REQUEST, not the stub's NOT_IMPLEMENTED, so
 * input validation runs before any handler.
 */
describe("Calendar inputs", () => {
  it.each([
    [
      "months.get with month 13",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.months.get.query({
          year: 2026,
          month: 13,
        }),
    ],
    [
      "months.list with a limit over 100",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.months.list.query({ limit: 101 }),
    ],
    [
      "months.list centred on month 13",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.months.list.query({
          around: { year: 2026, month: 13 },
        }),
    ],
    [
      "months.list with a cursor year before MIN_YEAR",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.months.list.query({
          cursor: { year: MIN_YEAR - 1, month: 12 },
        }),
    ],
    [
      "months.list with the direction older",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.months.list.query({
          // @ts-expect-error the direction is "forward" or "backward".
          direction: "older",
        }),
    ],
    [
      "months.create with a repeated month",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.months.create.mutate({
          months: [
            { year: 2026, month: 10 },
            { year: 2026, month: 10 },
          ],
        }),
    ],
    [
      "months.create with 14 months",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.months.create.mutate({
          months: Array.from({ length: 14 }, (_, i) => ({
            year: 2027 + Math.floor(i / 12),
            month: (i % 12) + 1,
          })),
        }),
    ],
    [
      "months.publish with an extra key",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.months.publish.mutate({
          monthId: "month-1",
          expectedRevision: 1,
          ...{ status: "PUBLISHED" },
        }),
    ],
    [
      "entries.add with the date 2026-02-30",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.entries.add.mutate({
          monthId: "month-1",
          date: "2026-02-30",
          kindCode: "HEARING",
          resourceId: "resource-1",
        }),
    ],
    [
      "entries.move with version 0",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.entries.move.mutate({
          entries: [{ entryId: "entry-1", expectedVersion: 0 }],
          newDate: "2026-10-06",
        }),
    ],
    [
      "entries.move with no entries",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.entries.move.mutate({
          entries: [],
          newDate: "2026-10-06",
        }),
    ],
    [
      "entries.move with the same entry twice",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.entries.move.mutate({
          entries: [
            { entryId: "entry-1", expectedVersion: 1 },
            { entryId: "entry-1", expectedVersion: 1 },
          ],
          newDate: "2026-10-06",
        }),
    ],
    [
      "entries.add with a kind Colorado doesn't have",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.entries.add.mutate({
          monthId: "month-1",
          date: "2026-10-05",
          // @ts-expect-error SESSION isn't one of Colorado's entry types.
          kindCode: "SESSION",
          resourceId: null,
        }),
    ],
    [
      "public.months.get with month 2026-13",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.public.months.get.query({
          month: "2026-13",
        }),
    ],
    [
      "patterns.update with week 5",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.patterns.update.mutate({
          kindCode: "HEARING",
          resourceId: "resource-1",
          expectedPatternId: null,
          rules: [
            // @ts-expect-error week 5 is outside the WeekOfMonth type.
            { type: "weekOfMonth", week: 5, weekday: "MONDAY" },
          ],
          startTime: null,
          endTime: null,
        }),
    ],
    [
      "patterns.update with an end time and no start time",
      (c: Client) =>
        c.Calendar.usCo.paroleBoard.admin.patterns.update.mutate({
          kindCode: "HEARING",
          resourceId: "resource-1",
          expectedPatternId: null,
          rules: [{ type: "weekOfMonth", week: 1, weekday: "MONDAY" }],
          startTime: null,
          endTime: "12:00",
        }),
    ],
  ])("returns BAD_REQUEST for %s", async (_label, call) => {
    const client = await initUsCoClient(coEditor);

    expect(await codeOf(call(client))).toBe("BAD_REQUEST");
  });
});
