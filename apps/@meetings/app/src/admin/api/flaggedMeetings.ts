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

import type { inferRouterInputs } from "@trpc/server";

import type { AppRouter } from "~@meetings/trpc-types";

type FlaggedMeetingsRouter = AppRouter["v1"]["flaggedMeetings"];

export type ListFlaggedMeetingsResult = Awaited<
  ReturnType<FlaggedMeetingsRouter["list"]>
>;

export type FlaggedMeetingSummary =
  ListFlaggedMeetingsResult["meetings"][number];

export type FlaggedMeetingSourceStatus =
  ListFlaggedMeetingsResult["sources"][number];

export type FlaggedMeetingDetails = Awaited<
  ReturnType<FlaggedMeetingsRouter["getDetails"]>
>;

/** The parts of a meeting a flag can point at. */
export type FlagSection = keyof FlaggedMeetingSummary["sections"];

export type SectionReviews = FlaggedMeetingSummary["reviews"];

export type SectionReview = SectionReviews[FlagSection];

export type ReviewOutcomeSummary = NonNullable<SectionReview["latestOutcome"]>;

export type RecordOutcomeInput =
  inferRouterInputs<AppRouter>["v1"]["flaggedMeetings"]["recordOutcome"];
