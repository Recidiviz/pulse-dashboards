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
import type { FastifyRequest } from "fastify";

import {
  type CalendarPrismaClient,
  getPrismaClient,
} from "~@modules/Calendar/prisma";
import type {
  CalendarEntryType,
  CalendarRules,
} from "~@modules/Calendar/rules";
import { auth0Procedure, baseProcedure } from "~@modules-server/trpc-base";

import {
  CalendarNotFoundError,
  CalendarWithConfig,
  findCalendarByCode,
} from "./db/calendar";

/**
 * A calendar a state's API is fixed to: the state whose Calendar database
 * holds it, the Calendar row's code, and the rules its state's code gives the
 * engine. Each state's procedures build on one, so no request
 * names a state or a calendar.
 */
export interface FixedCalendar<Code extends string = string> {
  stateCode: string;
  code: string;
  rules: CalendarRules<Code>;
}

/** A CalendarEntryKind row with its entry type's behaviour from the rules. */
export type CalendarKind<Code extends string = string> = Omit<
  CalendarWithConfig["kinds"][number],
  "code"
> &
  CalendarEntryType<Code>;

/**
 * The calendar a handler works on: the row's id and identity, its rules and
 * settings, and its kinds with their behaviour, in sortOrder. Handlers scope
 * every query to its id.
 */
export interface ResolvedCalendar<Code extends string = string> {
  id: string;
  stateCode: string;
  code: string;
  name: string;
  rules: CalendarRules<Code>;
  kinds: CalendarKind<Code>[];
}

/**
 * Whether the user's routes claim grants the given route. The claim carries
 * Admin Panel keys such as "parole_publicCalendar". A key matches when its
 * last "_" segment equals the route exactly and its value is true, the way
 * the staff app reads route keys.
 */
export function resolveHasRouteAccess(
  routes: Record<string, boolean> | undefined,
  route: string,
): boolean {
  if (!routes) return false;
  return Object.entries(routes).some(
    ([key, allowed]) => allowed === true && key.split("_").pop() === route,
  );
}

const CALENDAR_NOT_FOUND = "Calendar not found";

/**
 * A state code as the StateCode header carries it, such as "US_CO" or
 * "US_DEMO". The header names the state the caller acts in, which may have no
 * Calendar database; the editor procedure then refuses it as another state's.
 */
const STATE_CODE_PATTERN = /^US_([A-Z]{2}|DEMO)$/;

/**
 * Reads the StateCode request header, which must be an uppercase state code
 * exactly. Fastify lowercases header names. The error never echoes the
 * header, since it's caller-controlled.
 */
function requireStateCodeHeader(req: FastifyRequest): string {
  const header = req.headers["statecode"];
  if (typeof header !== "string" || !STATE_CODE_PATTERN.test(header)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing or unsupported StateCode header",
    });
  }
  return header;
}

/**
 * Loads the fixed calendar's row and gives each kind row its entry type.
 * INTERNAL_SERVER_ERROR when the row is missing, because the seed hasn't run,
 * or when a kind row has no entry type in the rules, because then the code and
 * the data disagree. Neither is something the caller can fix.
 */
async function resolveCalendar<Code extends string>(
  prisma: CalendarPrismaClient,
  fixed: FixedCalendar<Code>,
): Promise<ResolvedCalendar<Code>> {
  let row: CalendarWithConfig;
  try {
    row = await findCalendarByCode(prisma, fixed.code);
  } catch (e) {
    if (e instanceof CalendarNotFoundError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: CALENDAR_NOT_FOUND,
      });
    }
    throw e;
  }
  const entryTypes = new Map<string, CalendarEntryType<Code>>(
    fixed.rules.entryTypes.map((type) => [type.code, type]),
  );
  const kinds = row.kinds.map((kind) => {
    const type = entryTypes.get(kind.code);
    if (!type) {
      // The kind's code only: the row holds no person data.
      console.error("Calendar kind has no entry type", {
        calendarId: row.id,
        kindCode: kind.code,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Calendar settings are invalid",
      });
    }
    return { ...kind, ...type };
  });
  return {
    id: row.id,
    stateCode: fixed.stateCode,
    code: row.code,
    name: row.name,
    rules: fixed.rules,
    kinds,
  };
}

/**
 * A signed-in staff user in the state named by the StateCode header. A state
 * user's token must be for that state; a Recidiviz user may act in any state.
 * ctx.user.email is lowercased for audit columns.
 */
export const calendarAuthedProcedure = auth0Procedure.use(
  async ({ ctx, next }) => {
    const { user } = ctx;
    if (!user) {
      // auth0Procedure already rejects this; the check narrows the type.
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const stateCode = requireStateCodeHeader(ctx.req);

    if (!user.isRecidivizUser && user.stateCode !== stateCode) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next({
      ctx: {
        stateCode,
        user: {
          email: user.email.toLowerCase(),
          isRecidivizUser: user.isRecidivizUser,
          routes: user.routes,
        },
      },
    });
  },
);

/**
 * Builds the editor procedure for one fixed calendar. The caller must be in
 * the calendar's state (the StateCode header names it, and
 * calendarAuthedProcedure has checked the user may act there) and have the
 * editor route from the calendar's settings, unless they're a Recidiviz user.
 * Both checks run before any query; only then does it open the calendar's own
 * state's Calendar database, never the one the header names. ctx.prisma
 * is that database's client and ctx.calendar the resolved calendar.
 */
export function createCalendarEditorProcedure<Code extends string>(
  fixed: FixedCalendar<Code>,
) {
  return calendarAuthedProcedure.use(async ({ ctx, next }) => {
    // A Recidiviz user passes calendarAuthedProcedure with any state's header,
    // so this check alone keeps them off another state's calendar.
    if (ctx.stateCode !== fixed.stateCode) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This calendar belongs to ${fixed.stateCode}`,
      });
    }
    if (
      !ctx.user.isRecidivizUser &&
      !resolveHasRouteAccess(ctx.user.routes, fixed.rules.settings.editorRoute)
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Calendar access required",
      });
    }
    const prisma = getPrismaClient(fixed.stateCode);
    const calendar = await resolveCalendar(prisma, fixed);
    return next({ ctx: { prisma, calendar } });
  });
}

/**
 * Builds the anonymous public read procedure for one fixed calendar. It reads
 * no token and no StateCode header and gives handlers no user, so a result
 * never depends on who asks. Mutations fail with METHOD_NOT_SUPPORTED.
 */
export function createCalendarPublicProcedure<Code extends string>(
  fixed: FixedCalendar<Code>,
) {
  return baseProcedure.use(async ({ type, next }) => {
    if (type !== "query") {
      throw new TRPCError({ code: "METHOD_NOT_SUPPORTED" });
    }
    const prisma = getPrismaClient(fixed.stateCode);
    const calendar = await resolveCalendar(prisma, fixed);
    return next({
      ctx: { prisma, calendar, user: undefined, isAuth0Authorized: false },
    });
  });
}
