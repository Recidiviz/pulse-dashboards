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

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useReportError } from "../host";
import { getCalendarErrorCode, isEditorFacingCalendarError } from "./errors";
import type {
  CalendarRouterInputs,
  MonthDetail,
  YearMonthOption,
} from "./types";
import { useCalendarTrpc } from "./useCalendarTrpc";

type AdminInputs = CalendarRouterInputs["admin"];

/** The open month a write changes, found in the cache before it's sent. */
type MonthWriteContext = { target: YearMonthOption | undefined };

/**
 * The cache handling every write that returns the month shares: add,
 * delete, move, cancel, uncancel, publish and unpublish.
 *
 * - Before the write goes out, any fetch of that month in flight stops, so a
 *   30-second refetch that started earlier can't land after the write and
 *   bring back the old month.
 * - On success the month the server returned becomes that month's query
 *   data, before mutateAsync resolves, so the screen shows the write with no
 *   refetch. Lists and the publish preview don't refetch either: no write
 *   here adds or removes a month, so a list's summaries keep their old
 *   status and revision until the list next refetches (the month picker
 *   reads only their year and month), and a published month has no preview
 *   to show.
 * - A failure that means the editor's copy is stale (STALE_CALENDAR_CODES),
 *   or one that could mean anything, such as a network error, refetches
 *   that one month, and the mutation stays pending until the refetch ends,
 *   so the screen snaps back to the server's state (Spec D, Edit conflicts).
 *   BAD_REQUEST means the server refused the input and changed nothing, so
 *   nothing refetches. refetchOnError adds queries to refetch, such as
 *   publish's preview.
 * - Errors the server wrote for editors are the screen's to show; anything
 *   else also goes to the host's error reporting.
 *
 * isTarget picks the month the input writes to out of the cached months, by
 * the month's id or an entry's id. Writes start from the open month, so it's
 * in the cache; when it isn't, every month fetch stops and a failure
 * refetches nothing.
 */
function useMonthWriteOptions<TInput>(
  isTarget: (input: TInput) => (month: MonthDetail) => boolean,
  refetchOnError?: (input: TInput, error: unknown) => Promise<void> | undefined,
) {
  const { querier } = useCalendarTrpc();
  const queryClient = useQueryClient();
  const reportError = useReportError();
  const monthQueryKey = (yearMonth: YearMonthOption) =>
    querier.admin.months.get.queryKey(yearMonth);

  return {
    onMutate: async (input: TInput): Promise<MonthWriteContext> => {
      const isInputsMonth = isTarget(input);
      const cached = queryClient
        .getQueriesData<MonthDetail | null>(
          querier.admin.months.get.pathFilter(),
        )
        .map(([, month]) => month)
        .find((month) => month && isInputsMonth(month));
      const target = cached
        ? { year: cached.year, month: cached.month }
        : undefined;
      await queryClient.cancelQueries(
        target
          ? { queryKey: monthQueryKey(target), exact: true }
          : querier.admin.months.get.pathFilter(),
      );
      return { target };
    },
    onSuccess: ({ month }: { month: MonthDetail }) => {
      queryClient.setQueryData(
        monthQueryKey({ year: month.year, month: month.month }),
        month,
      );
    },
    onError: async (
      error: unknown,
      input: TInput,
      context: MonthWriteContext | undefined,
    ) => {
      if (!isEditorFacingCalendarError(error)) reportError(error);
      if (getCalendarErrorCode(error) === "BAD_REQUEST") return;
      await Promise.all([
        context?.target &&
          queryClient.invalidateQueries({
            queryKey: monthQueryKey(context.target),
            exact: true,
          }),
        refetchOnError?.(input, error),
      ]);
    },
  };
}

const hasMonthId =
  (monthId: string) =>
  (month: MonthDetail): boolean =>
    month.id === monthId;

const hasEntry =
  (...entryIds: string[]) =>
  (month: MonthDetail): boolean =>
    month.entries.some((entry) => entryIds.includes(entry.id));

/**
 * Creates draft months from the facility patterns. On success the month
 * lists, Add month's choices and each created month refetch, since create
 * returns no months to store. A CONFLICT means another editor created one of
 * the months first, so the lists and Add month's choices refetch.
 */
export function useCreateMonths() {
  const { querier } = useCalendarTrpc();
  const queryClient = useQueryClient();
  const reportError = useReportError();
  const refetchLists = () =>
    Promise.all([
      queryClient.invalidateQueries(querier.admin.months.list.pathFilter()),
      queryClient.invalidateQueries(
        querier.admin.months.addOptions.pathFilter(),
      ),
    ]);
  return useMutation(
    querier.admin.months.create.mutationOptions({
      onSuccess: ({ created }) =>
        Promise.all([
          refetchLists(),
          ...created.map(({ year, month }) =>
            queryClient.invalidateQueries({
              queryKey: querier.admin.months.get.queryKey({ year, month }),
              exact: true,
            }),
          ),
        ]),
      onError: async (error) => {
        if (!isEditorFacingCalendarError(error)) reportError(error);
        if (getCalendarErrorCode(error) === "CONFLICT") await refetchLists();
      },
    }),
  );
}

/**
 * Publishes a DRAFT month when expectedRevision matches the revision the
 * editor reviewed. The month is then locked: the server refuses every entry
 * write to it until an editor clicks Edit month. A CONFLICT means the month
 * changed since that review, so the publish preview refetches along with
 * the month.
 */
export function usePublishMonth() {
  const { querier } = useCalendarTrpc();
  const queryClient = useQueryClient();
  return useMutation(
    querier.admin.months.publish.mutationOptions(
      useMonthWriteOptions<AdminInputs["months"]["publish"]>(
        ({ monthId }) => hasMonthId(monthId),
        ({ monthId }, error) =>
          getCalendarErrorCode(error) === "CONFLICT"
            ? queryClient.invalidateQueries({
                queryKey: querier.admin.months.publishPreview.queryKey({
                  monthId,
                }),
                exact: true,
              })
            : undefined,
      ),
    ),
  );
}

/**
 * Backs "Edit month": moves a PUBLISHED month back to DRAFT, which takes it
 * off the public calendar and lets editors change it again.
 */
export function useUnpublishMonth() {
  const { querier } = useCalendarTrpc();
  return useMutation(
    querier.admin.months.unpublish.mutationOptions(
      useMonthWriteOptions<AdminInputs["months"]["unpublish"]>(({ monthId }) =>
        hasMonthId(monthId),
      ),
    ),
  );
}

export function useAddEntry() {
  const { querier } = useCalendarTrpc();
  return useMutation(
    querier.admin.entries.add.mutationOptions(
      useMonthWriteOptions<AdminInputs["entries"]["add"]>(({ monthId }) =>
        hasMonthId(monthId),
      ),
    ),
  );
}

export function useDeleteEntry() {
  const { querier } = useCalendarTrpc();
  return useMutation(
    querier.admin.entries.delete.mutationOptions(
      useMonthWriteOptions<AdminInputs["entries"]["delete"]>(({ entryId }) =>
        hasEntry(entryId),
      ),
    ),
  );
}

/** Moves one or more entries of a month to another day in it, all or nothing. */
export function useMoveEntries() {
  const { querier } = useCalendarTrpc();
  return useMutation(
    querier.admin.entries.move.mutationOptions(
      useMonthWriteOptions<AdminInputs["entries"]["move"]>(({ entries }) =>
        hasEntry(...entries.map(({ entryId }) => entryId)),
      ),
    ),
  );
}

export function useCancelEntry() {
  const { querier } = useCalendarTrpc();
  return useMutation(
    querier.admin.entries.cancel.mutationOptions(
      useMonthWriteOptions<AdminInputs["entries"]["cancel"]>(({ entryId }) =>
        hasEntry(entryId),
      ),
    ),
  );
}

export function useUncancelEntry() {
  const { querier } = useCalendarTrpc();
  return useMutation(
    querier.admin.entries.uncancel.mutationOptions(
      useMonthWriteOptions<AdminInputs["entries"]["uncancel"]>(({ entryId }) =>
        hasEntry(entryId),
      ),
    ),
  );
}
