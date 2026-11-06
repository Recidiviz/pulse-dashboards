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

import type { QueryClient } from "@tanstack/react-query";
import { isTRPCClientError } from "@trpc/client";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";

import type { UsCoParoleBoardCalendarRouter } from "./types";

export type CalendarErrorCode = TRPC_ERROR_CODE_KEY;

/**
 * The codes whose server messages are written for editors, such as CONFLICT
 * "This hearing was just changed by Editor A." or PRECONDITION_FAILED
 * "This month changed since you reviewed it." (Spec D, Edit conflicts).
 */
const EDITOR_FACING_CODES: ReadonlySet<CalendarErrorCode> = new Set([
  "BAD_REQUEST",
  "CONFLICT",
  "NOT_FOUND",
  "PRECONDITION_FAILED",
]);

/**
 * The codes that mean the editor's copy of the month is stale, because
 * another tab or editor changed it, so trying again can't help: CONFLICT
 * "Someone else changed this entry. Refresh to see the latest calendar, then
 * try again.", NOT_FOUND when the entry or month is gone, and
 * PRECONDITION_FAILED when the month was published and is locked until an
 * editor clicks Edit month.
 */
export const STALE_CALENDAR_CODES: ReadonlySet<CalendarErrorCode> = new Set([
  "CONFLICT",
  "NOT_FOUND",
  "PRECONDITION_FAILED",
]);

export const GENERIC_CALENDAR_ERROR_MESSAGE =
  "Something went wrong. Try again, and if it keeps happening, contact Recidiviz.";

/**
 * Returns the tRPC error code of a failed calendar request, such as
 * "CONFLICT", or undefined when error isn't a tRPC error, such as a network
 * failure before any response.
 */
export function getCalendarErrorCode(
  error: unknown,
): CalendarErrorCode | undefined {
  if (!isTRPCClientError<UsCoParoleBoardCalendarRouter>(error))
    return undefined;
  return error.data?.code;
}

/**
 * Whether the server wrote error's message for the editor to read. Input
 * validation failures are BAD_REQUEST too, but tRPC sets their message to the
 * zod issues as a JSON array, so those don't count. That check relies on the
 * Modules server's tRPC setup having no errorFormatter; one that reshapes
 * validation errors needs a matching change here.
 */
export function isEditorFacingCalendarError(error: unknown): boolean {
  const code = getCalendarErrorCode(error);
  if (!code || !EDITOR_FACING_CODES.has(code)) return false;
  return !(error instanceof Error && error.message.trimStart().startsWith("["));
}

/**
 * Returns the message to show an editor for a failed calendar request: the
 * server's own message when it was written for editors, such as CONFLICT
 * "FCF is already on September 14.", and fallback otherwise, such as a
 * form's "We couldn't add this hearing.", so internal details never reach the
 * screen.
 */
export function editorErrorMessage(error: unknown, fallback: string): string {
  return isEditorFacingCalendarError(error) && error instanceof Error
    ? error.message
    : fallback;
}

/**
 * editorErrorMessage with GENERIC_CALENDAR_ERROR_MESSAGE as the fallback, for
 * a screen with no message of its own.
 */
export function getCalendarErrorMessage(error: unknown): string {
  return editorErrorMessage(error, GENERIC_CALENDAR_ERROR_MESSAGE);
}

// React Query's own default for queries in the browser.
const DEFAULT_QUERY_RETRIES = 3;

/**
 * The retry option for calendar queries. An error the server wrote for
 * editors never retries, since asking again gets the same answer and only
 * keeps the screen loading: publishPreview answers PRECONDITION_FAILED once
 * the month is no longer a draft. Any other error, such as a network failure,
 * retries as queryClient's default retry option says.
 */
export function calendarRetry(queryClient: QueryClient) {
  const fallback =
    queryClient.getDefaultOptions().queries?.retry ?? DEFAULT_QUERY_RETRIES;
  return (failureCount: number, error: unknown): boolean => {
    if (isEditorFacingCalendarError(error)) return false;
    if (typeof fallback === "function") {
      return fallback(failureCount, error as Error);
    }
    return typeof fallback === "number" ? failureCount < fallback : fallback;
  };
}
