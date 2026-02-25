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

import { trpc } from "../trpc/client";
import { isMeetingProcessing } from "../utils/isMeetingProcessing";

type Params = {
  personId: bigint;
};

export function useMeetings({ personId }: Params) {
  return trpc.v1.client.getMeetings.useQuery(
      { clientId: personId },
      { enabled: !!personId,
        refetchInterval: ({ state }) => {
          const hasMeetingInProgress = state.data?.some((meeting) => 
            isMeetingProcessing(meeting.postMeetingProcessingStatus)
          );
          return hasMeetingInProgress ? 5000 : false;
        },
        placeholderData: keepPreviousData,
      },
    );
}