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

export function useStaffTimeline(
  applicationId: string | undefined,
  enabled: boolean,
  includeProviderNotSelected = false,
) {
  return trpc.timeline.getForStaff.useQuery(
    { applicationId: applicationId ?? "", includeProviderNotSelected },
    { enabled: enabled && !!applicationId, staleTime: 0 },
  );
}

export function useProviderTimeline(
  applicationId: string | undefined,
  enabled: boolean,
) {
  return trpc.timeline.getForProvider.useQuery(
    { applicationId: applicationId ?? "" },
    { enabled: enabled && !!applicationId, staleTime: 0 },
  );
}

// Marks the dashboard's "New Updates" state as seen for this viewer, so the
// list also needs to refetch — not just the timeline itself.
export function useMarkStaffModalOpened() {
  const utils = trpc.useUtils();
  return trpc.timeline.markModalOpenedForStaff.useMutation({
    onSuccess: () => {
      void utils.housingApplication.getByStaff.invalidate();
    },
  });
}

export function useMarkProviderModalOpened() {
  const utils = trpc.useUtils();
  return trpc.timeline.markModalOpenedForProvider.useMutation({
    onSuccess: () => {
      void utils.housingApplication.getProviderApplications.invalidate();
    },
  });
}
