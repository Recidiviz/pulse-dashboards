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

import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import type { RecordingStatus } from "~@reentry/frontend/types/recording";

export const useUpdateRecordingStatus = () => {
  const { getAccessToken } = useAuth();

  const {
    mutateAsync: updateSessionStatus,
    isPending,
    error,
  } = $api.useMutation("put", "/recordings/sessions/{session_id}/status");

  const updateStatus = async (sessionId: string, status: RecordingStatus) => {
    try {
      await updateSessionStatus({
        params: { path: { session_id: sessionId } },
        body: { status },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      console.log(`Updated session ${sessionId} status to ${status}`);
    } catch (err) {
      console.error(`Failed to update session status to ${status}:`, err);
      throw err;
    }
  };

  return {
    updateStatus,
    isUpdating: isPending,
    error,
  };
};
