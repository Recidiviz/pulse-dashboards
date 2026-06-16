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

import { Person, PersonType } from "~@meetings/app/shared/api";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import type { AppRouter } from "~@meetings/trpc-types";

import { useMeetingActions } from "./useMeetingActions";
import { MeetingEventType } from "./useMeetingEventQueue";
import { useOfflineEventFactory } from "./useOfflineEventFactory";
import { useReconnectUploadStore } from "./useReconnectUploadStore";

type Params = inferRouterInputs<AppRouter>["v1"]["meeting"]["endMeeting"] & {
  personId: bigint;
  personType: PersonType;
  audioUri?: string;
  audioBlob?: Blob;
  person?: Person;
};

export function useEndMeeting() {
  const { showSnackbar } = useSnackbar();
  const { isOnline } = useIsOnline();
  const { dispatch: dispatchOfflineEvent } = useOfflineEventFactory();
  const { endMeeting } = useMeetingActions();
  const { initUpload } = useReconnectUploadStore();

  return useMutation({
    networkMode: "always",
    mutationFn: ({
      personId,
      personType,
      audioUri,
      audioBlob,
      person,
      ...vars
    }: Params) => {
      if (!isOnline) {
        const endTime = new Date();
        initUpload(vars.meetingId, { person, recordedAt: endTime });
        dispatchOfflineEvent({
          type: MeetingEventType.Ended,
          meetingId: vars.meetingId,
          personId,
          personType,
          endTime,
          userNotepadNotes: vars.userNotepadNotes,
          audioUri,
          audioBlob,
          person,
        });

        return Promise.resolve();
      }

      return endMeeting({ ...vars, personId, personType });
    },
    onError: () => showSnackbar("Failed to end meeting. Please try again."),
  });
}
