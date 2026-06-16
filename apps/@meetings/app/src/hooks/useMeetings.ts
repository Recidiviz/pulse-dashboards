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

import { keepPreviousData } from "@tanstack/react-query";

import { PersonType } from "~@meetings/app/shared/api";

import { ClientMeetings, ResidentMeetings } from "../common/types";
import { trpc } from "../shared/api";
import { isMeetingProcessing } from "../utils/isMeetingProcessing";

type Params = {
  personId: bigint;
  personType: PersonType;
};

export function useMeetings({ personId, personType }: Params) {
  const refetchInterval = ({
    state,
  }: {
    state: { data?: ClientMeetings | ResidentMeetings };
  }) => {
    const hasMeetingInProgress = state.data?.some((meeting) =>
      isMeetingProcessing(meeting.postMeetingProcessingStatus),
    );
    return hasMeetingInProgress ? 5000 : false;
  };

  const clientQuery = trpc.v1.client.getMeetings.useQuery(
    { clientId: personId },
    {
      enabled: personType === "client" && !!personId,
      refetchInterval,
      placeholderData: keepPreviousData,
    },
  );

  const residentQuery = trpc.v1.resident.getMeetings.useQuery(
    { residentId: personId },
    {
      enabled: personType === "resident" && !!personId,
      refetchInterval,
      placeholderData: keepPreviousData,
    },
  );

  return personType === "resident" ? residentQuery : clientQuery;
}
