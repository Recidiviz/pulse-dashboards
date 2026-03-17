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

import type { AppRouter } from "~@meetings/trpc-types";

import { useSnackbar } from "../components/Snackbar";
import { trpc } from "../trpc/client";

type Params = inferRouterInputs<AppRouter>["v1"]["meeting"]["endMeeting"] & {
  personId: bigint;
};

export function useEndMeeting() {
  const { showSnackbar } = useSnackbar();
  const utils = trpc.useUtils();

  return useMutation({
    mutationFn: ({ personId: _, ...vars }: Params) =>
      utils.client.v1.meeting.endMeeting.mutate(vars),
    onSuccess: (_, { personId }) => {
      utils.v1.client.getMeetings.invalidate({ clientId: personId });
      utils.v1.resident.getMeetings.invalidate({ residentId: personId });
      utils.v1.client.list.invalidate();
      utils.v1.resident.list.invalidate();
    },
    onError: () => showSnackbar("Failed to end meeting. Please try again."),
  });
}
