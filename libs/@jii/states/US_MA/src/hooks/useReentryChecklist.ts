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
  useMutationState,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import type { ReentryChecklistItemId } from "~@jii/configs";
import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";

import { ReentryChecklistChange } from "./types";
import { toChecklistItems } from "./utils";

const CHECKLIST_SAVE_ID = "reentry-checklist-save";

/**
 * Returns the resident's Reentry Checklist items, and a setChecked that checks
 * or unchecks one of them.
 */
export function useReentryChecklist() {
  const { personPseudoId } = useTypedParams(State.Resident);
  const {
    apiClient: { trpc, trpcQuerier },
  } = useRootStore();
  const queryClient = useQueryClient();

  const checklistQuery =
    trpcQuerier.state.usMa.getReentryChecklistItemStates.queryOptions({
      pseudonymizedId: personPseudoId,
    });
  const { data: savedItems } = useSuspenseQuery(checklistQuery);

  const { mutate } = useMutation({
    mutationKey: [CHECKLIST_SAVE_ID],
    // Saves run one at a time, in the order the resident made them, so their
    // last click is the one stored. See
    // https://tanstack.com/query/latest/docs/framework/react/guides/mutations#mutation-scopes
    scope: { id: CHECKLIST_SAVE_ID },
    mutationFn: (change: ReentryChecklistChange) =>
      trpc.state.usMa.updateReentryChecklistItemState.mutate({
        pseudonymizedId: personPseudoId,
        ...change,
      }),
    // Returning this promise keeps the save pending until the refetch lands.
    // Otherwise its change stops showing before the cache has the new value,
    // and the box briefly flips back.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: checklistQuery.queryKey }),
    onError: (error) => captureException(error),
  });

  // Every save still in progress, not just the latest one useMutation tracks,
  // so clicking several items in a row shows them all. See
  // https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
  const pendingSaves = useMutationState({
    filters: { mutationKey: [CHECKLIST_SAVE_ID], status: "pending" },
    select: (mutation) => ({
      submittedAt: mutation.state.submittedAt,
      // Cast to ReentryChecklistChange since variables returns an unknown type,
      // and we know that the variables will match the ReentryChecklistChange shape.
      change: mutation.state.variables as ReentryChecklistChange,
    }),
  });

  // Sorted by when each save was submitted, so a later click on an item
  // always overrides an earlier one. See
  // https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates#if-the-mutation-and-the-query-dont-live-in-the-same-component
  const pendingChanges = [...pendingSaves]
    .sort((a, b) => a.submittedAt - b.submittedAt)
    .map((save) => save.change);

  const items = toChecklistItems(savedItems, pendingChanges);

  return {
    items,
    personalizedItemCount: items.filter((item) => item.isPersonalized).length,
    setChecked: (itemId: ReentryChecklistItemId, checked: boolean) =>
      mutate({ itemId, checked }),
  };
}
