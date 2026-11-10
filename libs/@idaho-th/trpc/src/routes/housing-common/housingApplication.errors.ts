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

import { ApplicationStage } from "~@idaho-th/prisma/client";
import {
  HOUSING_APPLICATION_ERRORS,
  isBeyondReleaseDatePastGracePeriod,
  RELEASE_DATE_IN_PAST_ERROR,
  RELEASE_DATE_INVALID_ERROR,
  toCalendarDay,
} from "~@idaho-th/shared";
import { isPreferredProviderFkViolation } from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";
import { parseDateString } from "~@idaho-th/trpc/utils/common";

/** Shared NOT_FOUND messages for housing application routes. */
export const HOUSING_APPLICATION_NOT_FOUND = {
  APPLICATION: "Application not found",
  STAFF_APPLICATION: "Application not found for this staff member",
  PROVIDER_APPLICATION: "Provider application not found",
  PROVIDER_APPLICATION_FOR_PROVIDER:
    HOUSING_APPLICATION_ERRORS.NOT_FOUND_FOR_PROVIDER,
} as const;

export const STAFF_CASE_CLOSED_MESSAGE = HOUSING_APPLICATION_ERRORS.CASE_CLOSED;

export const STAFF_CASE_DRAFT_MESSAGE = HOUSING_APPLICATION_ERRORS.CASE_DRAFT;

export const STAFF_CASE_NOT_APPLICATION_MESSAGE =
  "Providers can only be added while the application is in the Application stage" as const;

export function throwHousingApplicationNotFound(
  message: (typeof HOUSING_APPLICATION_NOT_FOUND)[keyof typeof HOUSING_APPLICATION_NOT_FOUND],
): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export function throwStaffCaseClosed(): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: STAFF_CASE_CLOSED_MESSAGE,
  });
}

export function throwStaffCaseDraft(): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: STAFF_CASE_DRAFT_MESSAGE,
  });
}

/**
 * Catch handler for housing application writes: maps known database
 * rejections to client-facing TRPCErrors and rethrows anything else untouched.
 */
export function handleHousingApplicationWriteError(error: unknown): never {
  if (isPreferredProviderFkViolation(error)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "One or more preferred providers do not exist",
    });
  }
  throw error;
}

export function assertStaffCaseNotClosed(stage: ApplicationStage): void {
  if (stage === ApplicationStage.CLOSED) {
    throwStaffCaseClosed();
  }
}

export function assertStaffCaseNotDraft(stage: ApplicationStage): void {
  if (stage === ApplicationStage.DRAFT) {
    throwStaffCaseDraft();
  }
}

/** Case must be neither closed nor a draft to be modified. */
export function assertStaffCaseModifiable(stage: ApplicationStage): void {
  assertStaffCaseNotClosed(stage);
  assertStaffCaseNotDraft(stage);
}

/**
 * Refuses a date that is not a real calendar day, or that both moves more than
 * the grace period into the past and differs from the stored one.
 *
 * `parseDateString` decides what counts as readable — the same function the
 * update schema applies to `expectedReleaseDate`, so the column and the form
 * field answer alike.
 */
function assertDayNotMovedIntoPast(
  next: string | null | undefined,
  previous: string | null | undefined,
): void {
  // Trimmed, because the client trims on submit: a stored value the parser
  // cannot read is only ever resubmitted in its trimmed form, and comparing it
  // raw would reject the record's other fields along with it.
  if (next?.trim() === previous?.trim()) return;

  if (next == null || next.trim() === "") return;

  const parsed = parseDateString(next);
  if (parsed === null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: RELEASE_DATE_INVALID_ERROR,
    });
  }

  // parseDateString builds the Date with Date.UTC from the matched parts, so
  // it carries no local offset and the first ten characters are the calendar
  // day it parsed.
  const day = parsed.toISOString().slice(0, 10);

  // Resubmitting the stored day is not a move, so a record whose date has
  // fallen behind stays editable.
  if (day === toCalendarDay(previous)) return;

  if (isBeyondReleaseDatePastGracePeriod(day)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: RELEASE_DATE_IN_PAST_ERROR,
    });
  }
}

/**
 * A release date may never be *moved* to a day more than
 * `RELEASE_DATE_PAST_GRACE_PERIOD_DAYS` days in the past.
 *
 * Both fields are checked: the update payload writes the record's date column
 * from `expectedReleaseDate`, while `formData.tpdHousingNeededDate` is the
 * value the detail view and the printed application render. Validating only
 * the column would let a hand-rolled request leave the column intact while
 * putting a too-far-past date in front of the reader.
 *
 * Deliberately not applied to application creation or draft submission —
 * a digitized paper application may legitimately carry a date that has passed.
 */
export function assertReleaseDateNotInPast(
  patch: {
    expectedReleaseDate?: string | null;
    formData?: { tpdHousingNeededDate?: string | null } | null;
  },
  previous: {
    expectedReleaseDate?: Date | null;
    tpdHousingNeededDate?: string | null;
  },
): void {
  assertDayNotMovedIntoPast(
    patch.expectedReleaseDate,
    previous.expectedReleaseDate?.toISOString(),
  );
  assertDayNotMovedIntoPast(
    patch.formData?.tpdHousingNeededDate,
    previous.tpdHousingNeededDate,
  );
}

export function assertStaffCaseApplicationStage(stage: ApplicationStage): void {
  if (stage !== ApplicationStage.APPLICATION) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: STAFF_CASE_NOT_APPLICATION_MESSAGE,
    });
  }
}
