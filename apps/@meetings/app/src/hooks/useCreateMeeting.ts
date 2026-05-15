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

import { createId } from "@paralleldrive/cuid2";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";

import { Person, PersonType } from "../common/types";
import useIsOnline from "../shared/lib/useIsOnline";
import { useMeetingActions } from "./useMeetingActions";
import { MeetingEventType } from "./useMeetingEventQueue";
import { useOfflineEventFactory } from "./useOfflineEventFactory";

type Params = {
  person?: Person | null;
  meetingType: string | null;
  personType?: PersonType | null;
  onSuccess: (meetingId: string) => void;
};

export function useCreateMeeting({
  person,
  meetingType,
  personType,
  onSuccess,
}: Params) {
  const { isOnline } = useIsOnline();
  const { dispatch: dispatchOfflineEvent } = useOfflineEventFactory();
  const { createMeeting } = useMeetingActions();

  const {
    mutate: handleCreateMeeting,
    mutateAsync: createMeetingAsync,
    isPending: isCreating,
  } = useMutation({
    networkMode: "always",
    mutationFn: async () => {
      const meetingId = createId();
      const startTime = new Date();

      if (!person || !personType || !meetingType) return meetingId;

      if (!isOnline) {
        dispatchOfflineEvent({
          type: MeetingEventType.Created,
          meetingId,
          meetingType,
          personId: person.personId,
          personType,
          startTime,
        });

        return meetingId;
      }

      await createMeeting({
        personId: person.personId,
        personType,
        meetingId,
        meetingType,
        startTime,
      });

      return meetingId;
    },
    onSuccess,
    onError: (err) => {
      console.error("[createMeeting] Failed:", err);
      Alert.alert("Error", "Failed to create meeting. Please try again.");
    },
  });

  return { handleCreateMeeting, createMeetingAsync, isCreating };
}
