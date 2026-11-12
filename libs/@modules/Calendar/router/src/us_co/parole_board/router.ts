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

import { router } from "~@modules-server/trpc-base";

import { notImplemented } from "../../calendar.errors";
import { createMonths, listAddMonthOptions } from "../../services/createMonths";
import {
  addEntry,
  deleteEntry,
  moveEntries,
  setEntryCancelled,
} from "../../services/entries";
import {
  getPublishPreview,
  publishMonth,
  unpublishMonth,
} from "../../services/monthStatus";
import { getPublicMonth } from "../../services/publicMonths";
import {
  getConfig,
  getMonth,
  listCurrentPatterns,
  listEditorMonths,
} from "../../services/reads";
import {
  usCoPublicCalendarAnonymousProcedure as anyone,
  usCoPublicCalendarEditorProcedure as editor,
} from "./procedures";
import {
  addEntryInput,
  createMonthsInput,
  entryVersionInput,
  getMonthInput,
  listMonthsInput,
  monthIdInput,
  moveEntriesInput,
  publicMonthInput,
  publishMonthInput,
  updatePatternInput,
} from "./schema";
import type {
  CreateMonthsResult,
  MonthListPage,
  UsCoCalendarConfig,
  UsCoCurrentPatternRow,
  UsCoDeleteEntryResult,
  UsCoEntryMutationResult,
  UsCoMonthDetail,
  UsCoMoveEntriesResult,
  UsCoPublicMonth,
  UsCoPublishPreview,
  UsCoPublishResult,
  UsCoUnpublishResult,
  YearMonthOption,
} from "./types";

const PATH = "Calendar.usCo.paroleBoard";

const monthsRouter = router({
  list: editor
    .input(listMonthsInput)
    .query(
      async ({ ctx, input }): Promise<MonthListPage> =>
        listEditorMonths(ctx.prisma, ctx.calendar, input),
    ),

  /** Returns null when the month doesn't exist. */
  get: editor
    .input(getMonthInput)
    .query(
      async ({ ctx, input }): Promise<UsCoMonthDetail | null> =>
        getMonth(ctx.prisma, ctx.calendar, input),
    ),

  /**
   * The months the Add month modal can offer, in ascending order: the current
   * month in America/Denver when it's missing, and the next 12.
   */
  addOptions: editor.query(
    async ({ ctx }): Promise<YearMonthOption[]> =>
      listAddMonthOptions(ctx.prisma, ctx.calendar),
  ),

  /**
   * Creates DRAFT months from the patterns and Colorado's generation rules:
   * holidays and weekends skipped, the 3rd-Thursday rule applied. All
   * the months are created or none.
   */
  create: editor
    .input(createMonthsInput)
    .mutation(
      async ({ ctx, input }): Promise<CreateMonthsResult> =>
        createMonths(ctx.prisma, ctx.calendar, ctx.user.email, input.months),
    ),

  /**
   * What months.publish would publish. A DRAFT month only: a PUBLISHED month
   * is PRECONDITION_FAILED.
   */
  publishPreview: editor
    .input(monthIdInput)
    .query(
      async ({ ctx, input }): Promise<UsCoPublishPreview> =>
        getPublishPreview(ctx.prisma, ctx.calendar, input.monthId),
    ),

  /**
   * Publishes a DRAFT month when expectedRevision matches, which puts its
   * entries on the public calendar and locks it, and returns the published
   * month. A PUBLISHED month is PRECONDITION_FAILED.
   */
  publish: editor.input(publishMonthInput).mutation(
    async ({ ctx, input }): Promise<UsCoPublishResult> =>
      publishMonth(ctx.prisma, ctx.calendar, {
        monthId: input.monthId,
        expectedRevision: input.expectedRevision,
        email: ctx.user.email,
      }),
  ),

  /**
   * The editor's Edit month: moves a PUBLISHED month back to DRAFT, which
   * takes it off the public calendar and unlocks its entries until its next
   * publish. It returns the month back in DRAFT.
   */
  unpublish: editor.input(monthIdInput).mutation(
    async ({ ctx, input }): Promise<UsCoUnpublishResult> =>
      unpublishMonth(ctx.prisma, ctx.calendar, {
        monthId: input.monthId,
        email: ctx.user.email,
      }),
  ),
});

/**
 * Every entry write needs a DRAFT month. A PUBLISHED month is locked, so a
 * write to it is PRECONDITION_FAILED until an editor moves it back to DRAFT
 * with months.unpublish. Each write returns the month as it is after the
 * write, so the client can show it without fetching it again.
 */
const entriesRouter = router({
  /**
   * Adds a MANUAL entry on a weekday Colorado allows, Monday to Friday. A
   * holiday never blocks it.
   */
  add: editor
    .input(addEntryInput)
    .mutation(
      async ({ ctx, input }): Promise<UsCoEntryMutationResult> =>
        addEntry(ctx.prisma, ctx.calendar, ctx.user.email, input),
    ),

  /** Business Meetings can only be cancelled, never deleted. */
  delete: editor
    .input(entryVersionInput)
    .mutation(
      async ({ ctx, input }): Promise<UsCoDeleteEntryResult> =>
        deleteEntry(ctx.prisma, ctx.calendar, ctx.user.email, input),
    ),

  /**
   * Moves one or more entries of one month to another weekday in it, all or
   * nothing. A move to the entries' own day changes nothing, but on a
   * PUBLISHED month it is still PRECONDITION_FAILED.
   */
  move: editor
    .input(moveEntriesInput)
    .mutation(
      async ({ ctx, input }): Promise<UsCoMoveEntriesResult> =>
        moveEntries(ctx.prisma, ctx.calendar, ctx.user.email, input),
    ),

  /**
   * Full Board and Business Meetings can be cancelled; hearings can't.
   * Cancelling a cancelled entry changes nothing, but on a PUBLISHED month it
   * is still PRECONDITION_FAILED.
   */
  cancel: editor
    .input(entryVersionInput)
    .mutation(
      async ({ ctx, input }): Promise<UsCoEntryMutationResult> =>
        setEntryCancelled(
          ctx.prisma,
          ctx.calendar,
          ctx.user.email,
          input,
          true,
        ),
    ),

  /** Like cancel: a repeat on a PUBLISHED month is still PRECONDITION_FAILED. */
  uncancel: editor
    .input(entryVersionInput)
    .mutation(
      async ({ ctx, input }): Promise<UsCoEntryMutationResult> =>
        setEntryCancelled(
          ctx.prisma,
          ctx.calendar,
          ctx.user.email,
          input,
          false,
        ),
    ),
});

const configRouter = router({
  /**
   * Colorado's settings from its code, its entry types with their behaviour,
   * and its resource types and active resources with their full names.
   */
  get: editor.query(
    async ({ ctx }): Promise<UsCoCalendarConfig> =>
      getConfig(ctx.prisma, ctx.calendar),
  ),
});

const patternsRouter = router({
  listCurrent: editor.query(
    async ({ ctx }): Promise<UsCoCurrentPatternRow[]> =>
      listCurrentPatterns(ctx.prisma, ctx.calendar),
  ),

  /**
   * Saves a new version of one slot's pattern. It stays a stub for v1: until
   * the patterns editor ships, pattern changes ship as new seed files.
   */
  update: editor
    .input(updatePatternInput)
    .mutation(
      async (): Promise<UsCoCurrentPatternRow> =>
        notImplemented(`${PATH}.admin.patterns.update`),
    ),
});

const publicMonthsRouter = router({
  /**
   * The one public read: a PUBLISHED month's public entries as
   * they are now, and its PUBLISHED neighbours. Without a month it lands on
   * the current month in America/Denver if that's published, else the
   * nearest later published month (with notPublishedYet set), else the
   * nearest earlier one. A DRAFT month, or one that doesn't exist, is
   * NOT_FOUND.
   *
   * With nothing published it returns null rather than NOT_FOUND: the page
   * shows "No months have been published yet." for that, a normal state,
   * and keeps NOT_FOUND for "This month isn't available."
   */
  get: anyone
    .input(publicMonthInput)
    .query(
      async ({ ctx, input }): Promise<UsCoPublicMonth | null> =>
        getPublicMonth(ctx.prisma, ctx.calendar, input),
    ),
});

/**
 * Colorado's Public Calendar API, which the Calendar module's router serves
 * at Calendar.usCo.paroleBoard. admin holds the editor procedures,
 * which need the publicCalendar route; public holds the one anonymous
 * read.
 */
export const usCoPublicCalendarRouter = router({
  admin: router({
    months: monthsRouter,
    entries: entriesRouter,
    config: configRouter,
    patterns: patternsRouter,
  }),
  public: router({ months: publicMonthsRouter }),
});
