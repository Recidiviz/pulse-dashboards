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

import { useMutation } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";

import type { AppRouter } from "~@meetings/trpc-types";

import useIsOnline from "./useIsOnline";
import { useMeetingActions } from "./useMeetingActions";
import { MeetingEventType } from "./useMeetingEventQueue";
import { useOfflineEventFactory } from "./useOfflineEventFactory";

type Params = inferRouterInputs<AppRouter>["v1"]["meeting"]["updateNotes"];

export function useUpdateNotes(options?: {
  onSuccess?: () => void;
  onError?: () => void;
}) {
  const { dispatch: dispatchOfflineEvent } = useOfflineEventFactory();
  const { isOnline } = useIsOnline();
  const { updateNotes } = useMeetingActions();

  return useMutation({
    networkMode: "always",
    mutationFn: (vars: Params) => {
      if (!isOnline) {
        dispatchOfflineEvent({
          type: MeetingEventType.Edited,
          meetingId: vars.meetingId,
          userNotepadNotes: vars.userNotepadNotes,
          criticalUpdates: vars.criticalUpdates,
          actionItems: vars.actionItems,
          caseNote: vars.caseNote,
        });

        return Promise.resolve();
      }

      return updateNotes(vars);
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (err) => {
      console.error("[updateNotes] Failed:", err);
      options?.onError?.();
    },
  });
}
