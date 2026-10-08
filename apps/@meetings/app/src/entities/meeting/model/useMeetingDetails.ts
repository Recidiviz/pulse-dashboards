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

import { trpc } from "~@meetings/app/shared/api";

import { isMeetingProcessing } from "../lib/isMeetingProcessing";

export function useMeetingDetails(meetingId?: string) {
  return trpc.v1.meeting.getDetails.useQuery(
    // @ts-expect-error - it won't run if meetingId is falsy
    { meetingId },
    {
      enabled: !!meetingId,
      // Retrying a denied or missing meeting can't succeed.
      retry: (failureCount, error) =>
        error.data?.code !== "FORBIDDEN" &&
        error.data?.code !== "NOT_FOUND" &&
        failureCount < 3,
      refetchInterval: ({ state }) => {
        const isProcessing = state.data?.postMeetingProcessingStatus
          ? isMeetingProcessing(state.data.postMeetingProcessingStatus)
          : false;
        return isProcessing ? 1000 : false;
      },
    },
  );
}
