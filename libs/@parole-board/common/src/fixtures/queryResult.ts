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
  QueryObserverSuccessResult,
  UseMutationResult,
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
 * A successful Suspense query result holding data, to inject in place of a
 * data hook: `injectable(useMonth, () =>
 * queryResult(september2026.monthDetail))`.
 */
export function queryResult<TData, TError = Error>(
  data: TData,
): UseSuspenseQueryResult<TData, TError> {
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
