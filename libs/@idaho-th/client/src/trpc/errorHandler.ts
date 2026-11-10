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
import { TRPCClientError } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";

import {
  HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
  HOUSING_PROVIDER_REQUIRED_MESSAGE,
} from "~@idaho-th/shared";

import type { HousingProviderStore } from "../datastores/HousingProviderStore";
import { toastError } from "../utils/errors/toast";
import { trpc } from "./client";

const FALLBACK_MESSAGE = "An error occurred";

/** The host app wires this to logout, so nothing else may claim it. */
export function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED"
  );
}

export function isHousingProviderRequiredError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError &&
    error.data?.code === "FORBIDDEN" &&
    error.message === HOUSING_PROVIDER_REQUIRED_MESSAGE
  );
}

export function isHousingProviderAccessDeniedError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError &&
    error.data?.code === "FORBIDDEN" &&
    error.message === HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE
  );
}

/**
 * Recovery for the two forbidden errors that mean the caller has to choose an
 * organization again: none could be resolved, or the one in effect is no
 * longer theirs. Both land on the selection screen; only the denial has
 * anything to tell the user.
 *
 * Returns true when it took the error, so the caller stops there.
 */
export function handleProviderAuthorizationError(
  error: unknown,
  housingProviderStore: HousingProviderStore | undefined,
  queryClient: QueryClient,
): boolean {
  const isAccessDenied = isHousingProviderAccessDeniedError(error);
  if (!isAccessDenied && !isHousingProviderRequiredError(error)) return false;

  housingProviderStore?.requireHousingProviderSelection();
  // The organization list behind the picker may be why this request was
  // refused, so it is re-read rather than served from the infinite stale
  // time. `resolve` permits a caller with no organization and so cannot
  // raise this error again.
  void queryClient.invalidateQueries({
    queryKey: getQueryKey(trpc.housingProvider.resolve),
  });
  if (isAccessDenied) toastError(HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE);
  return true;
}

export function getErrorMessage(_error: unknown): string {
  return FALLBACK_MESSAGE;
}
