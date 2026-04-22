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
import { inferRouterInputs } from "@trpc/server";

import useIsOnline from "~@meetings/app/hooks/useIsOnline";
import type { AppRouter } from "~@meetings/trpc-types";

import { PersonType } from "../common/types";
import { useSnackbar } from "../shared/ui/Snackbar";
import { useMeetingActions } from "./useMeetingActions";
import { MeetingEventType, useMeetingEventQueue } from "./useMeetingEventQueue";
import { useOfflineEventFactory } from "./useOfflineEventFactory";

type Params =
  inferRouterInputs<AppRouter>["v1"]["meeting"]["discardMeeting"] & {
    personId: bigint;
    personType: PersonType;
  };

export function useDiscardMeeting() {
  const { showSnackbar } = useSnackbar();
  const { isOnline } = useIsOnline();
  const { dispatch: dispatchOfflineEvent, removeMeetingFromCache } =
    useOfflineEventFactory();
  const { removeEventsOfType } = useMeetingEventQueue();
  const { discardMeeting } = useMeetingActions();

  return useMutation({
    networkMode: "always",
    mutationFn: ({ personId, personType, ...vars }: Params) => {
      if (!isOnline) {
        // If this meeting was _created_ while offline,
        // don't even bother creating a discard event -
        // instead, just drop the original creation event
        const removedCreatedEvents = removeEventsOfType(
          vars.meetingId,
          MeetingEventType.Created,
        );

        if (removedCreatedEvents.length === 0) {
          dispatchOfflineEvent({
            type: MeetingEventType.Discarded,
            meetingId: vars.meetingId,
            personId,
            personType,
          });
        } else {
          removeMeetingFromCache(vars.meetingId, personId, personType);
        }

        return Promise.resolve();
      }
      return discardMeeting({ ...vars, personId, personType });
    },
    onError: () => showSnackbar("Failed to discard meeting. Please try again."),
  });
}
