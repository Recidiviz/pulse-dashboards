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

import type { UsCoParoleBoardKindCode } from "~@modules/Calendar/rules/us_co/parole_board";

import type {
  CalendarConfig,
  CurrentPatternRow,
  DeleteEntryResult,
  EntryDto,
  EntryMutationResult,
  KindDto,
  MonthDetail,
  MoveEntriesResult,
  PublicDay,
  PublicMonth,
  PublishPreview,
  PublishResult,
  UnpublishResult,
} from "../../types";

/**
 * Colorado's API types: the engine's output types with kind narrowed to
 * Colorado's fixed entry types. The Parole Board client reads them
 * through ~@modules-server/trpc-types.
 */
export type UsCoKindCode = UsCoParoleBoardKindCode;
export type UsCoCalendarConfig = CalendarConfig<UsCoKindCode>;
export type UsCoCurrentPatternRow = CurrentPatternRow<UsCoKindCode>;
export type UsCoDeleteEntryResult = DeleteEntryResult<UsCoKindCode>;
export type UsCoEntryDto = EntryDto<UsCoKindCode>;
export type UsCoEntryMutationResult = EntryMutationResult<UsCoKindCode>;
export type UsCoKindDto = KindDto<UsCoKindCode>;
export type UsCoMonthDetail = MonthDetail<UsCoKindCode>;
export type UsCoMoveEntriesResult = MoveEntriesResult<UsCoKindCode>;
export type UsCoPublicDay = PublicDay<UsCoKindCode>;
export type UsCoPublicMonth = PublicMonth<UsCoKindCode>;
export type UsCoPublishPreview = PublishPreview<UsCoKindCode>;
export type UsCoPublishResult = PublishResult<UsCoKindCode>;
export type UsCoUnpublishResult = UnpublishResult<UsCoKindCode>;

export type {
  CreateMonthNotice,
  CreateMonthsResult,
  LatestPublication,
  MonthCounts,
  MonthListPage,
  MonthStatus,
  MonthSummary,
  ResourceDto,
  ResourceTypeDto,
  YearMonthOption,
} from "../../types";
