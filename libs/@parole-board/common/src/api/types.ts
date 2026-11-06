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

import type {
  inferRouterInputs,
  inferRouterOutputs,
  TRPCBuiltRouter,
} from "@trpc/server";

import type { CalendarRouter } from "~@modules-server/trpc-types";

/**
 * Colorado's Parole Board calendar API, which the Calendar module serves at
 * Calendar.usCo.paroleBoard. tRPC types a nested router as a plain
 * record, so this rebuilds the module router's usCo.paroleBoard branch as a
 * router, with the module's root types, for the client to point at.
 */
export type UsCoParoleBoardCalendarRouter = TRPCBuiltRouter<
  CalendarRouter["_def"]["_config"]["$types"],
  CalendarRouter["usCo"]["paroleBoard"]
>;

/**
 * The calendar API's types, read off UsCoParoleBoardCalendarRouter's
 * procedures. This library is tagged scope:client, so it can't import the
 * server library that declares them, but it may import router types from
 * ~@modules-server/trpc-types. The API serves only Colorado's Parole Board
 * calendar, so entry kinds are Colorado's fixed list. Timestamps
 * are Dates, which superjson carries; calendar dates are "YYYY-MM-DD" strings.
 */
export type CalendarRouterInputs =
  inferRouterInputs<UsCoParoleBoardCalendarRouter>;
export type CalendarRouterOutputs =
  inferRouterOutputs<UsCoParoleBoardCalendarRouter>;

type AdminOutputs = CalendarRouterOutputs["admin"];

/** A month with its entries, holidays and counts, as the editor sees it. */
export type MonthDetail = NonNullable<AdminOutputs["months"]["get"]>;
/** One page of months.list. Its items are in ascending month order. */
export type MonthListPage = AdminOutputs["months"]["list"];
export type MonthSummary = MonthListPage["items"][number];
export type MonthStatus = MonthSummary["status"];
export type MonthCounts = MonthDetail["counts"];
export type EntryDto = MonthDetail["entries"][number];
export type EntryKindCode = EntryDto["kind"]["code"];
/** A year and a month from 1 (January) to 12. */
export type YearMonthOption = AdminOutputs["months"]["addOptions"][number];
export type PublishPreview = AdminOutputs["months"]["publishPreview"];
export type CreateMonthsResult = AdminOutputs["months"]["create"];
export type PublishResult = AdminOutputs["months"]["publish"];
export type UnpublishResult = AdminOutputs["months"]["unpublish"];
/** The output of entries.add, cancel and uncancel. */
export type EntryMutationResult = AdminOutputs["entries"]["add"];
export type MoveEntriesResult = AdminOutputs["entries"]["move"];
export type DeleteEntryResult = AdminOutputs["entries"]["delete"];

/**
 * The calendar's settings and reference data from config.get, such as
 * calendar.allowedWeekdays. Named apart from CalendarConfig, the tenant
 * setting that turns the calendar on in the host app.
 */
export type CalendarApiConfig = AdminOutputs["config"]["get"];
export type KindDto = CalendarApiConfig["kinds"][number];
export type ResourceDto = CalendarApiConfig["resources"][number];
export type ResourceTypeDto = CalendarApiConfig["resourceTypes"][number];
export type CurrentPatternRow = AdminOutputs["patterns"]["listCurrent"][number];
