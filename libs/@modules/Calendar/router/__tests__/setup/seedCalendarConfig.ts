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

import type { CalendarPrismaClient } from "~@modules/Calendar/prisma";
import type { CalendarConfig } from "~@modules/Calendar/rules";
import { entrySlotKey } from "~@modules/Calendar/rules";

import { testCalendarConfig } from "./calendarConfig";
import { AUDIT_EMAIL } from "./fixtures";

function byKey<T>(rows: T[], key: (row: T) => string): Record<string, T> {
  return Object.fromEntries(rows.map((row) => [key(row), row]));
}

/**
 * Inserts a configuration's resource types, resources, kinds and version 1
 * patterns into an existing calendar, and returns the rows keyed by code (and
 * patterns by slotKey) so a test can build entries and newer versions on them.
 * It defaults to testCalendarConfig, which is synthetic.
 */
export async function seedCalendarConfig(
  prisma: CalendarPrismaClient,
  calendarId: string,
  config: Omit<CalendarConfig, "calendar"> = testCalendarConfig,
) {
  const audit = { createdByEmail: AUDIT_EMAIL, updatedByEmail: AUDIT_EMAIL };

  const typeRows = await Promise.all(
    config.resourceTypes.map((type) =>
      prisma.calendarResourceType.create({ data: { calendarId, ...type } }),
    ),
  );
  const typeIds = new Map(typeRows.map((row) => [row.code, row.id]));

  const resourceRows = await Promise.all(
    config.resources.map(({ typeCode, ...resource }) => {
      const typeId = typeIds.get(typeCode);
      if (!typeId) throw new Error(`No resource type ${typeCode}`);
      return prisma.calendarResource.create({
        data: { calendarId, typeId, ...resource, ...audit },
      });
    }),
  );
  const resources = byKey(resourceRows, (row) => row.code);

  const kindRows = await Promise.all(
    config.kinds.map((kind) =>
      prisma.calendarEntryKind.create({ data: { calendarId, ...kind } }),
    ),
  );
  const kinds = byKey(kindRows, (row) => row.code);

  const patternRows = await Promise.all(
    config.patterns.map(({ kindCode, resourceCode, ...pattern }) =>
      prisma.calendarEntryPattern.create({
        data: {
          calendarId,
          kindId: kinds[kindCode].id,
          resourceId: resourceCode === null ? null : resources[resourceCode].id,
          slotKey: entrySlotKey({ kindCode, resourceCode }),
          version: 1,
          ...pattern,
          createdByEmail: AUDIT_EMAIL,
        },
      }),
    ),
  );
  const patterns = byKey(patternRows, (row) => row.slotKey);

  return { resources, kinds, patterns };
}

export type SeededCalendar = Awaited<ReturnType<typeof seedCalendarConfig>>;
