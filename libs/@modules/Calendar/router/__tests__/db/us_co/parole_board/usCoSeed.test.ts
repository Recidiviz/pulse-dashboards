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

import { readdirSync, readFileSync } from "node:fs";

import { Client } from "pg";

import {
  assertEntryShape,
  entrySlotKey,
  parseCalendarConfig,
} from "~@modules/Calendar/rules";
import {
  US_CO_PAROLE_BOARD_ENTRY_TYPES,
  US_CO_PAROLE_BOARD_SETTINGS,
} from "~@modules/Calendar/rules/us_co/parole_board";

/** The Calendar migrations folder, which Prisma applies in name order. */
const MIGRATIONS_DIR = new URL(
  "../../../../../prisma/prisma/migrations/",
  import.meta.url,
);

/** The Calendar seed files, applied by hand in name order after migrations. */
const SEEDS_DIR = new URL(
  "../../../../../prisma/prisma/seeds/",
  import.meta.url,
);

const REFERENCE_DATA_EMAIL = "system:reference-data";

/** Limits a query to the PAROLE_BOARD_PUBLIC calendar, aliased as c. */
const CALENDAR_FILTER = `c."code" = 'PAROLE_BOARD_PUBLIC'`;

/** The PAROLE_BOARD_PUBLIC calendar's id, for queries on its child tables. */
const CALENDAR_ID = `(SELECT c."id" FROM "Calendar" c WHERE ${CALENDAR_FILTER})`;

/**
 * A database of its own on the test Postgres server, so the other database
 * tests, which empty the Calendar tables before each test, can't remove the
 * seeded data, and this test sees exactly what the migrations and seed files
 * write.
 */
const SEEDED_DATABASE = `calendar_seeds_${process.pid}`;

/** The rows Colorado's seed file inserts, by table. */
const SEEDED_ROW_COUNTS = {
  Calendar: 1,
  CalendarResourceType: 2,
  CalendarEntryKind: 3,
  CalendarResource: 37,
  CalendarEntryPattern: 39,
};

type RowCounts = Record<keyof typeof SEEDED_ROW_COUNTS, number>;

/** The test server's address with another database name. */
function urlFor(database: string): string {
  const url = new URL(process.env["CALENDAR__US_CO_DATABASE_URL"] ?? "");
  url.pathname = `/${database}`;
  return url.toString();
}

let admin: Client;
let db: Client;
let afterMigrations: RowCounts;
let afterFirstSeed: RowCounts;
let afterSecondSeed: RowCounts;

/** Applies every migration to the empty database, in folder order. */
async function migrate(client: Client): Promise<void> {
  const folders = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const folder of folders) {
    // Each migration builds on the ones before it, so they run one at a time.
    // eslint-disable-next-line no-await-in-loop
    await client.query(
      readFileSync(new URL(`${folder}/migration.sql`, MIGRATIONS_DIR), "utf8"),
    );
  }
}

/** Applies every seed file, in name order. */
async function seed(client: Client): Promise<void> {
  const files = readdirSync(SEEDS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const file of files) {
    // A later seed file may refer to rows an earlier one inserted.
    // eslint-disable-next-line no-await-in-loop
    await client.query(readFileSync(new URL(file, SEEDS_DIR), "utf8"));
  }
}

/** Counts every row in each table the seed files write. */
async function countRows(client: Client): Promise<RowCounts> {
  const tables = Object.keys(SEEDED_ROW_COUNTS) as (keyof RowCounts)[];
  const { rows } = await client.query<RowCounts>(
    `SELECT ${tables
      .map((table) => `(SELECT count(*)::int FROM "${table}") AS "${table}"`)
      .join(", ")}`,
  );
  return rows[0];
}

async function selectRows<T>(sql: string): Promise<T[]> {
  return (await db.query(sql)).rows as T[];
}

/**
 * Reads the PAROLE_BOARD_PUBLIC calendar back in CalendarConfig's shape, with
 * codes in place of ids and each list in sortOrder. Only each slot's highest
 * pattern version is read, because a later seed file may append versions and
 * CalendarConfig holds one pattern per slot.
 */
async function readSeededConfig(): Promise<unknown> {
  const [calendar] = await selectRows(`
    SELECT "code", "name" FROM "Calendar" c WHERE ${CALENDAR_FILTER}`);
  const resourceTypes = await selectRows(`
    SELECT t."code", t."label", t."sortOrder"
    FROM "CalendarResourceType" t JOIN "Calendar" c ON c."id" = t."calendarId"
    WHERE ${CALENDAR_FILTER} ORDER BY t."sortOrder"`);
  const resources = await selectRows(`
    SELECT r."code", t."code" AS "typeCode", r."label", r."name", r."sortOrder", r."isActive"
    FROM "CalendarResource" r
    JOIN "Calendar" c ON c."id" = r."calendarId"
    JOIN "CalendarResourceType" t ON t."id" = r."typeId"
    WHERE ${CALENDAR_FILTER} ORDER BY r."sortOrder"`);
  const kinds = await selectRows(`
    SELECT k."code", k."label", k."sortOrder"
    FROM "CalendarEntryKind" k JOIN "Calendar" c ON c."id" = k."calendarId"
    WHERE ${CALENDAR_FILTER} ORDER BY k."sortOrder"`);
  const patterns = await selectRows(`
    SELECT k."code" AS "kindCode", r."code" AS "resourceCode", p."rules",
      p."startTime", p."endTime"
    FROM "CalendarEntryPattern" p
    JOIN "Calendar" c ON c."id" = p."calendarId"
    JOIN "CalendarEntryKind" k ON k."id" = p."kindId"
    LEFT JOIN "CalendarResource" r ON r."id" = p."resourceId"
    WHERE ${CALENDAR_FILTER} AND p."version" = (
      SELECT max(latest."version") FROM "CalendarEntryPattern" latest
      WHERE latest."calendarId" = p."calendarId" AND latest."slotKey" = p."slotKey")
    ORDER BY k."sortOrder", r."sortOrder" NULLS LAST`);
  return { calendar, resourceTypes, resources, kinds, patterns };
}

beforeAll(async () => {
  admin = new Client({
    connectionString: process.env["CALENDAR__US_CO_DATABASE_URL"],
  });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${SEEDED_DATABASE}"`);
  await admin.query(`CREATE DATABASE "${SEEDED_DATABASE}"`);
  db = new Client({ connectionString: urlFor(SEEDED_DATABASE) });
  await db.connect();
  await migrate(db);
  afterMigrations = await countRows(db);
  await seed(db);
  afterFirstSeed = await countRows(db);
  await seed(db);
  afterSecondSeed = await countRows(db);
});

afterAll(async () => {
  await db?.end();
  await admin?.query(`DROP DATABASE IF EXISTS "${SEEDED_DATABASE}"`);
  await admin?.end();
});

// Seed data stays out of migrations, which run on every deploy and in every
// state's database.
test("the migrations insert no calendar rows", () => {
  expect(afterMigrations).toEqual({
    Calendar: 0,
    CalendarResourceType: 0,
    CalendarEntryKind: 0,
    CalendarResource: 0,
    CalendarEntryPattern: 0,
  });
});

test("inserts Colorado's rows once, and a second run of the seed files changes nothing", () => {
  expect(afterFirstSeed).toEqual(SEEDED_ROW_COUNTS);
  expect(afterSecondSeed).toEqual(SEEDED_ROW_COUNTS);
});

// The seed SQL owns the calendar's data, and US_CO_REFERENCE_DATA is a test
// fixture that may drift from it, so these tests check that the seeded data is
// valid, never that it equals the fixture.
test("the seeded Parole Board calendar parses with parseCalendarConfig", async () => {
  const seeded = await readSeededConfig();

  expect(() => parseCalendarConfig(seeded)).not.toThrow();
});

test("has a kind row for each of Colorado's entry types, and patterns that fit them", async () => {
  const config = parseCalendarConfig(await readSeededConfig());
  const entryTypes = new Map(
    US_CO_PAROLE_BOARD_ENTRY_TYPES.map((type) => [type.code as string, type]),
  );
  const resources = new Map(
    config.resources.map((resource) => [resource.code, resource]),
  );

  expect(config.kinds.map(({ code }) => code)).toEqual([...entryTypes.keys()]);
  for (const pattern of config.patterns) {
    const type = entryTypes.get(pattern.kindCode);
    const resource =
      pattern.resourceCode === null
        ? null
        : resources.get(pattern.resourceCode) ?? null;
    expect(type).toBeDefined();
    expect(() =>
      assertEntryShape({
        calendarId: "co",
        kind: {
          calendarId: "co",
          code: pattern.kindCode,
          requiresResource: type?.requiresResource ?? false,
        },
        resource: resource && { ...resource, calendarId: "co" },
        isNew: true,
      }),
    ).not.toThrow();
  }
});

test("stores Full Board every Friday and the Business Meeting on the 3rd Friday", async () => {
  const config = parseCalendarConfig(await readSeededConfig());

  expect(
    config.patterns
      .filter(({ kindCode }) => kindCode !== "HEARING")
      .map(({ kindCode, rules }) => [kindCode, rules]),
  ).toEqual([
    ["FULL_BOARD", [{ type: "everyWeekday", weekday: "FRIDAY" }]],
    ["BUSINESS_MEETING", [{ type: "weekOfMonth", week: 3, weekday: "FRIDAY" }]],
  ]);
});

test("puts every pattern rule on a weekday the Board works, Monday to Friday", async () => {
  const config = parseCalendarConfig(await readSeededConfig());
  const allowed: readonly string[] =
    US_CO_PAROLE_BOARD_SETTINGS.allowedWeekdays;

  expect(
    config.patterns.flatMap(({ rules }) =>
      rules
        .map(({ weekday }) => weekday)
        .filter((weekday) => !allowed.includes(weekday)),
    ),
  ).toEqual([]);
});

test("names every hearing location", async () => {
  const config = parseCalendarConfig(await readSeededConfig());

  expect(config.resources.filter(({ name }) => name === null)).toEqual([]);
});

test("stores each pattern's slotKey as its kind and resource, numbering versions from 1 with no gaps", async () => {
  const rows = await selectRows<{
    kindCode: string;
    resourceCode: string | null;
    slotKey: string;
    version: number;
  }>(`
    SELECT k."code" AS "kindCode", r."code" AS "resourceCode", p."slotKey", p."version"
    FROM "CalendarEntryPattern" p
    JOIN "CalendarEntryKind" k ON k."id" = p."kindId"
    LEFT JOIN "CalendarResource" r ON r."id" = p."resourceId"
    WHERE p."calendarId" = ${CALENDAR_ID}
    ORDER BY p."slotKey", p."version"`);

  expect(rows).not.toEqual([]);
  const versionsBySlot = new Map<string, number[]>();
  for (const { kindCode, resourceCode, slotKey, version } of rows) {
    expect(slotKey).toBe(entrySlotKey({ kindCode, resourceCode }));
    versionsBySlot.set(slotKey, [
      ...(versionsBySlot.get(slotKey) ?? []),
      version,
    ]);
  }
  for (const versions of versionsBySlot.values()) {
    expect(versions).toEqual(versions.map((_, i) => i + 1));
  }
});

// CalendarResourceType and CalendarEntryKind have no audit columns.
test("credits every audit column to the reference data, not a person", async () => {
  const rows = await selectRows<{ email: string }>(`
    SELECT "createdByEmail" AS email FROM "Calendar" c WHERE ${CALENDAR_FILTER}
    UNION SELECT "updatedByEmail" FROM "Calendar" c WHERE ${CALENDAR_FILTER}
    UNION SELECT "createdByEmail" FROM "CalendarResource" WHERE "calendarId" = ${CALENDAR_ID}
    UNION SELECT "updatedByEmail" FROM "CalendarResource" WHERE "calendarId" = ${CALENDAR_ID}
    UNION SELECT "createdByEmail" FROM "CalendarEntryPattern" WHERE "calendarId" = ${CALENDAR_ID}`);

  expect(rows).toEqual([{ email: REFERENCE_DATA_EMAIL }]);
});
