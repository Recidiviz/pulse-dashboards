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

import { useSnackbar } from "~@meetings/app/components/Snackbar";
import { trpc } from "~@meetings/app/trpc/client";

export function useDiscardMeeting(personId: bigint) {
  const { showSnackbar } = useSnackbar();
  const utils = trpc.useUtils();

  return trpc.v1.meeting.discardMeeting.useMutation({
    onSuccess: () => {
      utils.v1.client.getMeetings.invalidate({ clientId: personId });
      utils.v1.resident.getMeetings.invalidate({ residentId: personId });
      utils.v1.client.list.invalidate();
      utils.v1.resident.list.invalidate();
    },
    onError: () => showSnackbar("Failed to discard meeting. Please try again."),
  });
}
