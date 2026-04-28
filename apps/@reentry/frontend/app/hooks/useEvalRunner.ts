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

import { useCallback, useEffect, useState } from "react";

import { BACKEND_URL } from "~@reentry/frontend/constants";
import { useExecutionPolling } from "~@reentry/frontend/hooks/useExecutionPolling";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showErrorToast } from "~@reentry/frontend-shared";

import { configHeaders } from "../(protected)/config/utils/configFetch";

interface UseEvalRunnerResult {
  isRunning: boolean;
  progress: number | null | undefined;
  message: string | null | undefined;
  refetchKey: number;
  run: () => Promise<void>;
}

export function useEvalRunner(endpoint: string): UseEvalRunnerResult {
  const auth = useAuth();
  const [refetchKey, setRefetchKey] = useState(0);

  const { isPolling, isCompleted, progress, message, startPolling } =
    useExecutionPolling({});

  useEffect(() => {
    if (isCompleted) {
      setRefetchKey((k) => k + 1);
    }
  }, [isCompleted]);

  const run = useCallback(async () => {
    try {
      const token = await auth.getAccessToken();
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: configHeaders(token),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        showErrorToast(body.detail ?? "Failed to start eval");
        return;
      }
      const { execution_id } = await response.json();
      startPolling(execution_id);
    } catch {
      showErrorToast("Failed to start eval");
    }
  }, [auth, endpoint, startPolling]);

  return { isRunning: isPolling, progress, message, refetchKey, run };
}
