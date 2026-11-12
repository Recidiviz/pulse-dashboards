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
import type { MonthDraft } from "~@modules/Calendar/rules";

import { toDbDate } from "../db/dates";

type DraftMonthWriter = Pick<
  CalendarPrismaClient,
  "calendarMonth" | "calendarEntry" | "calendarMonthStatusEvent"
>;

/**
 * Writes one new DRAFT month at revision 1, its generated entries at version
 * 1, and its CREATED status event, with email in every audit column. Callers
 * pass a transaction client, so a failure in any month rolls back them all.
 *
 * Returns the new month's id.
 */
export async function writeDraftMonth(
  tx: DraftMonthWriter,
  {
    calendarId,
    draft,
    email,
  }: { calendarId: string; draft: MonthDraft; email: string },
): Promise<string> {
  const { id } = await tx.calendarMonth.create({
    data: {
      calendarId,
      ...draft.yearMonth,
      status: "DRAFT",
      revision: 1,
      createdByEmail: email,
      updatedByEmail: email,
    },
    select: { id: true },
  });
  await tx.calendarEntry.createMany({
    data: draft.entries.map((entry) => ({
      calendarId,
      monthId: id,
      date: toDbDate(entry.date),
      kindId: entry.kindId,
      resourceId: entry.resourceId,
      slotKey: entry.slotKey,
      startTime: entry.startTime,
      endTime: entry.endTime,
      source: entry.source,
      version: 1,
      createdByEmail: email,
      updatedByEmail: email,
    })),
  });
  await tx.calendarMonthStatusEvent.create({
    data: {
      monthId: id,
      type: "CREATED",
      fromStatus: null,
      toStatus: "DRAFT",
      revision: 1,
      actorEmail: email,
    },
  });
  return id;
}
