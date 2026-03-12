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
import { trpc } from "../trpc/client";

type Params = {
  person: Person;
  personType: PersonType;
  onSuccess: (meetingId: string) => void;
};

export function useCreateMeeting({ person, personType, onSuccess }: Params) {
  const utils = trpc.useUtils();

  const { mutate: handleCreateMeeting, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const meetingId = createId();
      const startTime = new Date();

      if (personType === "client") {
        await utils.client.v1.client.createMeeting.mutate({
          clientId: person.personId,
          startTime,
          meetingId,
        });
      } else {
        await utils.client.v1.resident.createMeeting.mutate({
          residentId: person.personId,
          startTime,
          meetingId,
        });
      }

      return meetingId;
    },
    onSuccess,
    onError: (err) => {
      console.error("[createMeeting] Failed:", err);
      Alert.alert("Error", "Failed to create meeting. Please try again.");
    },
  });

  return { handleCreateMeeting, isCreating };
}
