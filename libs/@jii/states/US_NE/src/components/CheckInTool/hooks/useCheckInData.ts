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

import { captureException } from "@sentry/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { useRootStore, useSingleResidentContext } from "~@jii/data";

/**
 * Return information about the user's most recent 120-Day Check-In:
 * - data: The user's most recent Check-In from the database.
 * - updateMutation: A tRPC mutation. If it succeeds, immediately refreshes the value of data.
 *
 * Throws an error if the current resident has no check-in data:
 * This function should only be used on the Check-In Tool pages, which are accessible
 * only to residents who have an existent check-in.
 */
export function useCheckInData() {
  const { apiClient } = useRootStore();
  const { resident } = useSingleResidentContext();

  const { data } = useSuspenseQuery(
    apiClient.trpcQuerier.state.usNe.getCheckIn.queryOptions({
      pseudonymizedId: resident.pseudonymizedId,
    }),
  );

  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    apiClient.trpcQuerier.state.usNe.updateCheckIn.mutationOptions({
      onSuccess: (data) => {
        // Immediately update the getCheckIn cache with the data
        // we received from the database. This avoids an extra network fetch.
        // See: https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses
        queryClient.setQueryData(
          apiClient.trpcQuerier.state.usNe.getCheckIn.queryKey({
            pseudonymizedId: resident.pseudonymizedId,
          }),
          data,
        );
      },
      onError: (e) => {
        captureException(e);
      },
    }),
  );

  if (!data) {
    throw new Error("Can't access the 120-Day Check-In.");
  }

  return {
    data,
    updateMutation,
  };
}
