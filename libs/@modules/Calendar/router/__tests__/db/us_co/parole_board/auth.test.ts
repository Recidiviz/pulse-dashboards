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

import { US_CO_PAROLE_BOARD } from "~@modules/Calendar/rules/us_co/parole_board";
import type { Auth0User } from "~@modules-server/trpc-base";

import { usCoPublicCalendarRouter } from "../../../../src/us_co/parole_board";
import { testPrismaClient } from "../../../setup";
import {
  coEditor,
  coViewer,
  idUser,
  recidivizUser,
} from "../../../setup/users";
import {
  initUsCoClient,
  type usCoTestRouter,
} from "../../../us_co/parole_board/setup";

type Client = TRPCClient<typeof usCoTestRouter>;

/**
 * One call per editor procedure, each with a minimal valid input. The ids
 * don't exist, so a procedure that reads them answers NOT_FOUND.
 */
const ADMIN_CALLS = {
  "admin.months.list": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.months.list.query({}),
  "admin.months.get": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.months.get.query({
      year: 2026,
      month: 10,
    }),
  "admin.months.addOptions": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.months.addOptions.query(),
  "admin.months.create": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.months.create.mutate({
      months: [{ year: 2026, month: 10 }],
    }),
  "admin.months.publishPreview": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.months.publishPreview.query({
      monthId: "month-1",
    }),
  "admin.months.publish": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.months.publish.mutate({
      monthId: "month-1",
      expectedRevision: 1,
    }),
  "admin.months.unpublish": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.months.unpublish.mutate({
      monthId: "month-1",
    }),
  "admin.entries.add": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.entries.add.mutate({
      monthId: "month-1",
      date: "2026-10-05",
      kindCode: "HEARING",
      resourceId: "resource-1",
    }),
  "admin.entries.delete": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.entries.delete.mutate({
      entryId: "entry-1",
      expectedVersion: 1,
    }),
  "admin.entries.move": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.entries.move.mutate({
      entries: [{ entryId: "entry-1", expectedVersion: 1 }],
      newDate: "2026-10-06",
    }),
  "admin.entries.cancel": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.entries.cancel.mutate({
      entryId: "entry-1",
      expectedVersion: 1,
    }),
  "admin.entries.uncancel": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.entries.uncancel.mutate({
      entryId: "entry-1",
      expectedVersion: 1,
    }),
  "admin.config.get": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.config.get.query(),
  "admin.patterns.listCurrent": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.patterns.listCurrent.query(),
  "admin.patterns.update": (t: Client) =>
    t.Calendar.usCo.paroleBoard.admin.patterns.update.mutate({
      kindCode: "HEARING",
      resourceId: "resource-1",
      expectedPatternId: null,
      rules: [{ type: "weekOfMonth", week: 1, weekday: "MONDAY" }],
      startTime: "09:00",
      endTime: "12:00",
    }),
} satisfies Record<string, (t: Client) => Promise<unknown>>;

const PUBLIC_CALLS = {
  "public.months.get": (t: Client) =>
    t.Calendar.usCo.paroleBoard.public.months.get.query({}),
} satisfies Record<string, (t: Client) => Promise<unknown>>;

const ADMIN_PROCEDURES = Object.keys(ADMIN_CALLS);

/**
 * Calls every procedure and returns each one's tRPC error code, or "OK".
 * Comparing the whole map shows every procedure that went wrong at once.
 */
async function outcomes(
  calls: Record<string, (t: Client) => Promise<unknown>>,
  user: Auth0User | undefined,
  options: Parameters<typeof initUsCoClient>[1] = {},
): Promise<Record<string, string>> {
  const client = await initUsCoClient(user, options);
  const results = await Promise.all(
    Object.entries(calls).map(async ([name, call]) => {
      try {
        await call(client);
        return [name, "OK"];
      } catch (e) {
        if (!(e instanceof TRPCClientError)) throw e;
        return [name, e.data?.code];
      }
    }),
  );
  return Object.fromEntries(results);
}

function every(names: string[], code: string): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, code]));
}

describe("Calendar access", () => {
  it("covers every procedure in the router", () => {
    expect([...ADMIN_PROCEDURES, ...Object.keys(PUBLIC_CALLS)].sort()).toEqual(
      Object.keys(usCoPublicCalendarRouter._def.procedures).sort(),
    );
  });

  it("is UNAUTHORIZED without a token", async () => {
    expect(await outcomes(ADMIN_CALLS, undefined, { omitAuth: true })).toEqual(
      every(ADMIN_PROCEDURES, "UNAUTHORIZED"),
    );
  });

  it.each([
    ["a US_CO user without the route", coViewer, {}],
    ["a Recidiviz user acting in US_ID", recidivizUser, { stateCode: "US_ID" }],
    ["a US_ID user with the route", idUser, { stateCode: "US_ID" }],
  ])("is FORBIDDEN for %s", async (_label, user, options) => {
    expect(await outcomes(ADMIN_CALLS, user, options)).toEqual(
      every(ADMIN_PROCEDURES, "FORBIDDEN"),
    );
  });

  it.each([
    ["a US_CO editor", coEditor],
    ["a Recidiviz user", recidivizUser],
  ])("reaches the NOT_IMPLEMENTED stub for %s", async (_label, user) => {
    expect(await outcomes(ADMIN_CALLS, user)).toEqual(
      every(ADMIN_PROCEDURES, "NOT_IMPLEMENTED"),
    );
  });

  it.each([
    ["no token", undefined, { omitAuth: true, omitStateCode: true }],
    ["a US_ID user", idUser, { stateCode: "US_ID" }],
  ])("lets anyone reach the public read: %s", async (_label, user, options) => {
    expect(await outcomes(PUBLIC_CALLS, user, options)).toEqual({
      "public.months.get": "NOT_IMPLEMENTED",
    });
  });

  it("names the procedure in the stub's message", async () => {
    const client = await initUsCoClient(coEditor);

    await expect(
      client.Calendar.usCo.paroleBoard.admin.months.get.query({
        year: 2026,
        month: 10,
      }),
    ).rejects.toMatchObject({
      message:
        "Calendar.usCo.paroleBoard.admin.months.get isn't implemented yet",
    });
  });

  it("only reaches the Parole Board calendar: without its row, every call is INTERNAL_SERVER_ERROR", async () => {
    await testPrismaClient.calendar.deleteMany({
      where: { code: US_CO_PAROLE_BOARD.code },
    });

    expect(
      await outcomes({ ...ADMIN_CALLS, ...PUBLIC_CALLS }, coEditor),
    ).toEqual(
      every(
        [...ADMIN_PROCEDURES, "public.months.get"],
        "INTERNAL_SERVER_ERROR",
      ),
    );
  });
});
