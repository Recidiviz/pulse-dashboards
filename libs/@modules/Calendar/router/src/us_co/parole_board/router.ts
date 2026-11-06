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
      async (): Promise<MonthListPage> =>
        notImplemented(`${PATH}.admin.months.list`),
    ),

  /** Returns null when the month doesn't exist. */
  get: editor
    .input(getMonthInput)
    .query(
      async (): Promise<UsCoMonthDetail | null> =>
        notImplemented(`${PATH}.admin.months.get`),
    ),

  /**
   * The months the Add month modal can offer, in ascending order: the current
   * month in America/Denver when it's missing, and the next 12.
   */
  addOptions: editor.query(
    async (): Promise<YearMonthOption[]> =>
      notImplemented(`${PATH}.admin.months.addOptions`),
  ),

  create: editor
    .input(createMonthsInput)
    .mutation(
      async (): Promise<CreateMonthsResult> =>
        notImplemented(`${PATH}.admin.months.create`),
    ),

  /**
   * What months.publish would publish. A DRAFT month only: a PUBLISHED month
   * is PRECONDITION_FAILED.
   */
  publishPreview: editor
    .input(monthIdInput)
    .query(
      async (): Promise<UsCoPublishPreview> =>
        notImplemented(`${PATH}.admin.months.publishPreview`),
    ),

  /**
   * Publishes a DRAFT month when expectedRevision matches, which puts its
   * entries on the public calendar and locks it, and returns the published
   * month. A PUBLISHED month is PRECONDITION_FAILED.
   */
  publish: editor
    .input(publishMonthInput)
    .mutation(
      async (): Promise<UsCoPublishResult> =>
        notImplemented(`${PATH}.admin.months.publish`),
    ),

  /**
   * The editor's Edit month: moves a PUBLISHED month back to DRAFT, which
   * takes it off the public calendar and unlocks its entries until its next
   * publish. It returns the month back in DRAFT.
   */
  unpublish: editor
    .input(monthIdInput)
    .mutation(
      async (): Promise<UsCoUnpublishResult> =>
        notImplemented(`${PATH}.admin.months.unpublish`),
    ),
});

/**
 * Every entry write needs a DRAFT month. A PUBLISHED month is locked, so a
 * write to it is PRECONDITION_FAILED until an editor moves it back to DRAFT
 * with months.unpublish. Each write returns the month as it is after the
 * write, so the client can show it without fetching it again.
 */
const entriesRouter = router({
  add: editor
    .input(addEntryInput)
    .mutation(
      async (): Promise<UsCoEntryMutationResult> =>
        notImplemented(`${PATH}.admin.entries.add`),
    ),

  delete: editor
    .input(entryVersionInput)
    .mutation(
      async (): Promise<UsCoDeleteEntryResult> =>
        notImplemented(`${PATH}.admin.entries.delete`),
    ),

  /** Moves one or more entries of one month to another day in it, all or nothing. */
  move: editor
    .input(moveEntriesInput)
    .mutation(
      async (): Promise<UsCoMoveEntriesResult> =>
        notImplemented(`${PATH}.admin.entries.move`),
    ),

  cancel: editor
    .input(entryVersionInput)
    .mutation(
      async (): Promise<UsCoEntryMutationResult> =>
        notImplemented(`${PATH}.admin.entries.cancel`),
    ),

  uncancel: editor
    .input(entryVersionInput)
    .mutation(
      async (): Promise<UsCoEntryMutationResult> =>
        notImplemented(`${PATH}.admin.entries.uncancel`),
    ),
});

const configRouter = router({
  /**
   * Colorado's settings from its code, its entry types with their behaviour,
   * and its resource types and active resources with their full names.
   */
  get: editor.query(
    async (): Promise<UsCoCalendarConfig> =>
      notImplemented(`${PATH}.admin.config.get`),
  ),
});

const patternsRouter = router({
  listCurrent: editor.query(
    async (): Promise<UsCoCurrentPatternRow[]> =>
      notImplemented(`${PATH}.admin.patterns.listCurrent`),
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
      async (): Promise<UsCoPublicMonth | null> =>
        notImplemented(`${PATH}.public.months.get`),
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
