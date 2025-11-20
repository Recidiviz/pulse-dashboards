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

"use client";
import { useEffect, useRef } from "react";

import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import type { components } from "~@reentry/openapi-types";

interface UseClientStatusPollingProps {
  enabled: boolean;
  interval?: number;
  onStatusUpdate?: (
    inProgressClients: components["schemas"]["ClientStatusUpdate"][],
  ) => void;
}

interface UseClientStatusPollingReturn {
  data: unknown;
  error: unknown;
  isPolling: boolean;
  startPolling: () => void;
}

export const useClientStatusPolling = ({
  enabled,
  interval = 5000, // 5 seconds default
  onStatusUpdate,
}: UseClientStatusPollingProps): UseClientStatusPollingReturn => {
  const { getAccessToken } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onStatusUpdateRef = useRef(onStatusUpdate);

  // Update the ref when the callback changes
  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  const { data, error, refetch } = $api.useQuery(
    "get",
    "/clients/status",
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled: false, // We'll manually trigger this
    },
  );

  const startPolling = () => {
    if (intervalRef.current) return; // Already polling

    const pollStatus = async () => {
      try {
        const result = await refetch();
        if (result.data && onStatusUpdateRef.current) {
          onStatusUpdateRef.current(result.data.in_progress);
        }
      } catch (error) {
        console.error("Error polling client status:", error);
      }
    };

    // Poll immediately
    pollStatus();

    // Set up interval polling
    intervalRef.current = setInterval(pollStatus, interval);
  };

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Auto-start polling when enabled becomes true
    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);

  return {
    data,
    error,
    isPolling: intervalRef.current !== null,
    startPolling,
  };
};
