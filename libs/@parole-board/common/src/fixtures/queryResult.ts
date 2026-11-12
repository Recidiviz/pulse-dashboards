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
  InfiniteData,
  InfiniteQueryObserverSuccessResult,
  QueryObserverPendingResult,
  QueryObserverSuccessResult,
  UseMutationResult,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
import { action } from "storybook/actions";

// Fields every query result shares. Each builder overrides the ones that
// differ by status.
function baseQueryFields() {
  return {
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false as const,
    isPaused: false,
    isPlaceholderData: false as const,
    isRefetching: false,
    isStale: false,
    isEnabled: true,
    fetchStatus: "idle" as const,
  };
}

// A promise that never settles, for results whose data never arrives.
const never = <T>() => new Promise<T>(() => undefined);

/**
 * A successful query result holding data, to inject in place of a hook read
 * with useQuery rather than Suspense: `injectable(useMonthWithoutSuspense,
 * () => loadedQueryResult(null))`.
 */
export function loadedQueryResult<TData, TError = Error>(
  data: TData,
): QueryObserverSuccessResult<TData, TError> {
  const result: QueryObserverSuccessResult<TData, TError> = {
    ...baseQueryFields(),
    data,
    error: null,
    isError: false,
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: true,
    status: "success",
    refetch: () => Promise.resolve(result),
    promise: Promise.resolve(data),
  };
  return result;
}

/**
 * A successful Suspense query result holding data, to inject in place of a
 * data hook: `injectable(useMonth, () =>
 * queryResult(september2026.monthDetail))`.
 */
export function queryResult<TData, TError = Error>(
  data: TData,
): UseSuspenseQueryResult<TData, TError> {
  return loadedQueryResult(data);
}

/**
 * A query result still waiting for its first data, to inject in place of a
 * hook read with useQuery rather than Suspense: `injectable(
 * useMonthWithoutSuspense, pendingQueryResult)`, the result before
 * loadedQueryResult's.
 */
export function pendingQueryResult<
  TData,
  TError = Error,
>(): QueryObserverPendingResult<TData, TError> {
  const result: QueryObserverPendingResult<TData, TError> = {
    ...baseQueryFields(),
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: true,
    isLoading: true,
    fetchStatus: "fetching",
    data: undefined,
    error: null,
    isError: false,
    isPending: true,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: false,
    status: "pending",
    refetch: () => Promise.resolve(result),
    promise: never(),
  };
  return result;
}

/**
 * A successful Suspense infinite query result holding pages, to inject in
 * place of a paged data hook: `injectable(useMonthsList, () =>
 * infiniteQueryResult([monthSummariesPage]))`. fetchNextPage and
 * fetchPreviousPage log to the Storybook actions panel and load nothing.
 */
export function infiniteQueryResult<
  TPage,
  TPageParam = unknown,
  TError = Error,
>(
  pages: TPage[],
  {
    hasNextPage = false,
    hasPreviousPage = false,
  }: { hasNextPage?: boolean; hasPreviousPage?: boolean } = {},
): UseSuspenseInfiniteQueryResult<InfiniteData<TPage, TPageParam>, TError> {
  const data: InfiniteData<TPage, TPageParam> = {
    pages,
    pageParams: pages.map(() => undefined as TPageParam),
  };
  const result: InfiniteQueryObserverSuccessResult<
    InfiniteData<TPage, TPageParam>,
    TError
  > = {
    ...baseQueryFields(),
    data,
    promise: Promise.resolve(data),
    status: "success",
    isSuccess: true,
    isError: false,
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    error: null,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
    fetchNextPage: () => {
      action("fetchNextPage")();
      return Promise.resolve(result);
    },
    fetchPreviousPage: () => {
      action("fetchPreviousPage")();
      return Promise.resolve(result);
    },
    refetch: () => Promise.resolve(result),
  };
  return result;
}

// The one promise every suspended query throws. React waits on it and, since
// it never settles, keeps the Suspense fallback showing.
const pendingForever = never<never>();

/**
 * Stands in for a Suspense data hook whose data never arrives, so the nearest
 * SuspenseBoundary keeps showing its skeleton: `injectable(useMonth,
 * suspendedQuery)`.
 */
export function suspendedQuery(): never {
  throw pendingForever;
}

/**
 * Stands in for a Suspense data hook whose fetch failed, so the nearest
 * SuspenseBoundary shows its error: `injectable(useMonth, () =>
 * failedQuery(new Error("Network error")))`.
 */
export function failedQuery(error: unknown): never {
  throw error;
}

/**
 * A mutation result for a component that calls a mutation hook. `mutate` and
 * `mutateAsync` log their variables to the Storybook actions panel and never
 * settle. Pass isPending or error to show those states; error wins when both
 * are set.
 */
export function mutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>({
  isPending = false,
  error = null,
}: { isPending?: boolean; error?: TError | null } = {}): UseMutationResult<
  TData,
  TError,
  TVariables,
  TContext
> {
  const shared = {
    data: undefined,
    context: undefined,
    failureCount: error ? 1 : 0,
    failureReason: error,
    isPaused: false,
    submittedAt: 0,
    reset: action("reset"),
    mutate: action("mutate"),
    mutateAsync: (variables: TVariables) => {
      action("mutateAsync")(variables);
      return never<TData>();
    },
  };
  if (error) {
    return {
      ...shared,
      variables: undefined as TVariables,
      error,
      isError: true,
      isIdle: false,
      isPending: false,
      isSuccess: false,
      status: "error",
    };
  }
  if (isPending) {
    return {
      ...shared,
      variables: undefined as TVariables,
      error: null,
      isError: false,
      isIdle: false,
      isPending: true,
      isSuccess: false,
      status: "pending",
    };
  }
  return {
    ...shared,
    variables: undefined,
    error: null,
    isError: false,
    isIdle: true,
    isPending: false,
    isSuccess: false,
    status: "idle",
  };
}
