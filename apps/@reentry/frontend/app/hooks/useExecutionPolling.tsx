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

import { useCallback, useEffect, useRef, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
interface UseExecutionPollingProps {
  interval?: number;
}

export const useExecutionPolling = ({
  interval = 2000,
}: UseExecutionPollingProps) => {
  const { getAccessToken } = useAuth();
  const [isPolling, setIsPolling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [executionId, setExectionId] = useState<string | null>(null);

  const attemptsRef = useRef(0); // to check the number of attempts done
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Active interval reference

  const { data, refetch, error } = $api.useQuery(
    "get",
    "/executions/{execution_id}",
    {
      params: {
        path: {
          execution_id: executionId || "",
        },
      },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
      enabled: !!executionId && isPolling && executionId.length > 0,
    },
  );
  const startPolling = useCallback(
    (executionId: string) => {
      setExectionId(executionId);
      setIsPolling(true);
      setIsCompleted(false);
      const poll = async () => {
        attemptsRef.current += 1;
        const { data, error } = await refetch();

        if (data && (data.status === "completed" || data.status === "failed")) {
          if (pollingIntervalRef.current)
            clearInterval(pollingIntervalRef.current as NodeJS.Timeout);
          setIsPolling(false);
          setIsCompleted(true);
          setExectionId(null);
        } else {
          if (error) {
            console.error("Error polling the execution status:", error);
            if (pollingIntervalRef.current)
              clearInterval(pollingIntervalRef.current as NodeJS.Timeout);
            setIsPolling(false);
            setExectionId(null);
          }
        }
      };

      pollingIntervalRef.current = setInterval(poll, interval);
      poll();
    },
    [refetch, interval],
  );

  // Cleanup the interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current as NodeJS.Timeout);
      }
    };
  }, []);

  return {
    isPolling,
    isCompleted,
    progress: data?.progress,
    message: data?.message,
    error: !!isPolling && !!error,
    startTime: data?.created_at
      ? new Date(`${data.created_at}Z`).getTime()
      : undefined,
    startPolling,
  };
};
