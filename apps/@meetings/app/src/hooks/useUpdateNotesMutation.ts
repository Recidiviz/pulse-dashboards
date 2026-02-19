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

import { trpc } from "../trpc/client";

export function useUpdateNotesMutation(meetingId: string) {
  const utils = trpc.useUtils();
  const updateNotesMutation = trpc.v1.meeting.updateNotes.useMutation({
    onSuccess: () => {
      console.log("Notes updated successfully on server");
      utils.v1.meeting.getDetails.invalidate({ meetingId });
    },
    onError: (err) => {
      console.error("[updateNotes] Failed:", err); 
    },
  });
  return updateNotesMutation;
};