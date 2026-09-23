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
import { extractError } from "~@meetings/app/shared/lib/errors";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";

export function useCompleteActionItem(meetingId: string) {
  const utils = trpc.useUtils();
  const { showSnackbar } = useSnackbar();

  return trpc.v1.meeting.completeActionItem.useMutation({
    onMutate: async ({ actionItemId }) => {
      await utils.v1.meeting.getDetails.cancel({ meetingId });
      const previousData = utils.v1.meeting.getDetails.getData({ meetingId });
      // Do an optimistic update here so the checkbox toggles before the server
      // confirms it. Aids on slow connections
      utils.v1.meeting.getDetails.setData({ meetingId }, (old) =>
        old
          ? {
              ...old,
              meetingActionItems: old.meetingActionItems.map((item) =>
                item.id === actionItemId
                  ? { ...item, completed: !item.completed }
                  : item,
              ),
            }
          : old,
      );
      return { previousData };
    },
    onError: (error, _vars, context) => {
      // If there was an error, roll back the optimistic update
      if (context?.previousData) {
        utils.v1.meeting.getDetails.setData(
          { meetingId },
          context.previousData,
        );
      }
      const message = extractError(error);
      showSnackbar(
        message
          ? `Failed to update action item completion: ${message}`
          : "Failed to update action item completion",
      );
    },
    onSettled: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
    },
  });
}
