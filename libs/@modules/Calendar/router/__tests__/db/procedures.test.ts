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

import { getPrismaClient } from "~@modules/Calendar/prisma";
import { type Auth0User, router } from "~@modules-server/trpc-base";

import {
  calendarAuthedProcedure,
  createCalendarEditorProcedure,
  createCalendarPublicProcedure,
  type FixedCalendar,
} from "../../src/procedures";
import { initFastifyAndSetUser, testPrismaClient } from "../setup";
import { TEST_RULES, testCalendarConfig } from "../setup/calendarConfig";
import {
  coEditor,
  coNoEmail,
  coRouteFalse,
  coViewer,
  idUser,
  recidivizUser,
} from "../setup/users";

/** The fixed calendar the procedures resolve: the test calendar in US_CO. */
const TEST_CALENDAR: FixedCalendar = {
  stateCode: "US_CO",
  code: testCalendarConfig.calendar.code,
  rules: TEST_RULES,
};
const MISSING_CALENDAR: FixedCalendar = { ...TEST_CALENDAR, code: "NOPE" };
const OTHER_ROUTE_CALENDAR: FixedCalendar = {
  ...TEST_CALENDAR,
  rules: {
    ...TEST_RULES,
    settings: { ...TEST_RULES.settings, editorRoute: "otherRoute" },
  },
};

const editorFor = (fixed: FixedCalendar) =>
  createCalendarEditorProcedure(fixed).query(({ ctx }) => ({
    id: ctx.calendar.id,
    stateCode: ctx.calendar.stateCode,
    kinds: ctx.calendar.kinds.map(({ code, cancellable, deletable }) => ({
      code,
      cancellable,
      deletable,
    })),
  }));

const testRouter = router({
  authed: calendarAuthedProcedure.query(({ ctx }) => ctx.user),
  editor: editorFor(TEST_CALENDAR),
  missingEditor: editorFor(MISSING_CALENDAR),
  otherRouteEditor: editorFor(OTHER_ROUTE_CALENDAR),
  pub: createCalendarPublicProcedure(TEST_CALENDAR).query(({ ctx }) => ({
    hasUser: ctx.user !== undefined,
    calendarId: ctx.calendar.id,
  })),
  missingPub: createCalendarPublicProcedure(MISSING_CALENDAR).query(() => "no"),
  pubWrite: createCalendarPublicProcedure(TEST_CALENDAR).mutation(() => "no"),
});

type Options = Omit<
  Parameters<typeof initFastifyAndSetUser<typeof testRouter>>[1],
  "router"
>;

function client(user: Auth0User | undefined, options: Options = {}) {
  return initFastifyAndSetUser(user, { ...options, router: testRouter });
}

/** "OK" when the call succeeds, otherwise the tRPC error code. */
async function outcome(call: Promise<unknown>): Promise<string> {
  try {
    await call;
    return "OK";
  } catch (e) {
    if (e instanceof TRPCClientError) return e.data?.code;
    throw e;
  }
}

async function errorOf(call: Promise<unknown>) {
  try {
    await call;
  } catch (e) {
    if (e instanceof TRPCClientError) return e;
  }
  throw new Error("Expected the call to fail");
}

function findTestCalendar() {
  return testPrismaClient.calendar.findUniqueOrThrow({
    where: { code: TEST_CALENDAR.code },
  });
}

describe("the error table", () => {
  it.each([
    // [caller, user, options, authed, editor, public]
    [
      "no token",
      undefined,
      { omitAuth: true },
      "UNAUTHORIZED",
      "UNAUTHORIZED",
      "OK",
    ],
    [
      "no token, no header",
      undefined,
      { omitAuth: true, omitStateCode: true },
      "UNAUTHORIZED",
      "UNAUTHORIZED",
      "OK",
    ],
    [
      "CO editor, no header",
      coEditor,
      { omitStateCode: true },
      "BAD_REQUEST",
      "BAD_REQUEST",
      "OK",
    ],
    [
      "CO editor, lowercase header",
      coEditor,
      { stateCode: "us_co" },
      "BAD_REQUEST",
      "BAD_REQUEST",
      "OK",
    ],
    ["CO editor", coEditor, {}, "OK", "OK", "OK"],
    [
      "CO editor, US_ID header",
      coEditor,
      { stateCode: "US_ID" },
      "FORBIDDEN",
      "FORBIDDEN",
      "OK",
    ],
    ["CO user without the route", coViewer, {}, "OK", "FORBIDDEN", "OK"],
    ["CO user with the route false", coRouteFalse, {}, "OK", "FORBIDDEN", "OK"],
    ["ID user", idUser, {}, "FORBIDDEN", "FORBIDDEN", "OK"],
    ["Recidiviz user", recidivizUser, {}, "OK", "OK", "OK"],
    [
      "Recidiviz user, US_ID header",
      recidivizUser,
      { stateCode: "US_ID" },
      "OK",
      "FORBIDDEN",
      "OK",
    ],
    [
      "token without the email claim",
      coNoEmail,
      {},
      "UNAUTHORIZED",
      "UNAUTHORIZED",
      "OK",
    ],
  ] as const)("%s", async (_caller, user, options, authed, editor, pub) => {
    const trpc = await client(user, options);

    expect({
      authed: await outcome(trpc.authed.query()),
      editor: await outcome(trpc.editor.query()),
      public: await outcome(trpc.pub.query()),
    }).toEqual({ authed, editor, public: pub });
  });
});

describe("error messages", () => {
  it("rejects an unknown StateCode header without repeating it", async () => {
    const trpc = await client(coEditor, { stateCode: "US_CO<script>" });

    const error = await errorOf(trpc.authed.query());

    expect(error.message).toBe("Missing or unsupported StateCode header");
  });
});

describe("calendarAuthedProcedure", () => {
  it("lowercases the email claim and passes on only email, isRecidivizUser and routes", async () => {
    const trpc = await client(coEditor);

    expect(await trpc.authed.query()).toEqual({
      email: "co.editor@example.com",
      isRecidivizUser: false,
      routes: { publicCalendar: true },
    });
  });

  it("ignores an X-Impersonated-Email header", async () => {
    const trpc = await client(coEditor, {
      extraHeaders: { "X-Impersonated-Email": "someone-else@example.com" },
    });

    expect((await trpc.authed.query()).email).toBe("co.editor@example.com");
  });

  it("ignores an X-Skip-Auth header", async () => {
    const trpc = await client(undefined, {
      omitAuth: true,
      extraHeaders: { "X-Skip-Auth": "true" },
    });

    expect(await outcome(trpc.authed.query())).toBe("UNAUTHORIZED");
  });
});

describe("createCalendarEditorProcedure", () => {
  it("resolves the fixed calendar's row, never the other calendar's", async () => {
    const co = await findTestCalendar();

    const trpc = await client(recidivizUser);

    expect(await trpc.editor.query()).toMatchObject({
      id: co.id,
      stateCode: "US_CO",
    });
  });

  // getPrismaClient throws for a state whose CALENDAR__<STATE>_DATABASE_URL
  // isn't set, which the caller would see as INTERNAL_SERVER_ERROR. A clean
  // FORBIDDEN shows the state check ran before any database was opened.
  it.each(["US_ID", "US_DEMO"])(
    "refuses a Recidiviz user acting in %s before opening any database",
    async (stateCode) => {
      expect(() => getPrismaClient(stateCode)).toThrow();
      const trpc = await client(recidivizUser, { stateCode });

      const error = await errorOf(trpc.editor.query());

      expect({ code: error.data?.code, message: error.message }).toEqual({
        code: "FORBIDDEN",
        message: "This calendar belongs to US_CO",
      });
    },
  );

  it("reads the route from the calendar's settings", async () => {
    const editorTrpc = await client(coEditor);
    expect(await outcome(editorTrpc.otherRouteEditor.query())).toBe(
      "FORBIDDEN",
    );

    const recidivizTrpc = await client(recidivizUser);
    expect(await outcome(recidivizTrpc.otherRouteEditor.query())).toBe("OK");
  });

  it("says why a user without the route is refused", async () => {
    const trpc = await client(coViewer);

    expect((await errorOf(trpc.editor.query())).message).toBe(
      "Calendar access required",
    );
  });

  it("gives each kind row its entry type's behaviour", async () => {
    const co = await findTestCalendar();
    await testPrismaClient.calendarEntryKind.createMany({
      data: testCalendarConfig.kinds.map((kind) => ({
        calendarId: co.id,
        ...kind,
      })),
    });
    const trpc = await client(coEditor);

    expect((await trpc.editor.query()).kinds).toEqual([
      { code: "SESSION", cancellable: false, deletable: true },
      { code: "STAFF_MEETING", cancellable: true, deletable: true },
    ]);
  });

  it("fails with INTERNAL_SERVER_ERROR for a kind row the rules don't list", async () => {
    const co = await findTestCalendar();
    await testPrismaClient.calendarEntryKind.create({
      data: { calendarId: co.id, code: "AUDIT", label: "Audit", sortOrder: 9 },
    });
    const trpc = await client(coEditor);

    expect(await outcome(trpc.editor.query())).toBe("INTERNAL_SERVER_ERROR");
    expect(await outcome(trpc.pub.query())).toBe("INTERNAL_SERVER_ERROR");
  });

  it("is INTERNAL_SERVER_ERROR when the fixed calendar has no row", async () => {
    const trpc = await client(coEditor);

    expect(await outcome(trpc.missingEditor.query())).toBe(
      "INTERNAL_SERVER_ERROR",
    );
  });
});

describe("createCalendarPublicProcedure", () => {
  it("gives handlers no user and the fixed calendar", async () => {
    const co = await findTestCalendar();
    const trpc = await client(coEditor);

    expect(await trpc.pub.query()).toEqual({
      hasUser: false,
      calendarId: co.id,
    });
  });

  it.each([
    ["with a token", coEditor, {}],
    ["without a token", undefined, { omitAuth: true }],
  ] as const)("refuses a mutation %s", async (_label, user, options) => {
    const trpc = await client(user, options);

    expect(await outcome(trpc.pubWrite.mutate())).toBe("METHOD_NOT_SUPPORTED");
  });

  it("is INTERNAL_SERVER_ERROR when the fixed calendar has no row", async () => {
    const trpc = await client(undefined, { omitAuth: true });

    const error = await errorOf(trpc.missingPub.query());

    expect({ code: error.data?.code, message: error.message }).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Calendar not found",
    });
  });
});
