// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useMemo } from "react";

import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth";
import type { RecordingSessionStatusResponse } from "~@reentry/frontend/types/recording";

export const useRecordingSessionStatus = (
  sessionId: string,
  enabled = false,
) => {
  const { getAccessToken } = useAuth();
  const accessToken = useMemo(() => getAccessToken(), [getAccessToken]);

  const { data, error, isLoading } = $api.useQuery(
    "get",
    "/recordings/sessions/{session_id}/status",
    {
      params: { path: { session_id: sessionId } },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "completed" || status === "error") {
          return false;
        }
        return 3000;
      },
      keepPreviousData: true, // avoid flicker between sessionId changes
    },
  );

  return {
    statusData: data as RecordingSessionStatusResponse | undefined,
    isLoading,
    error,
  };
};
