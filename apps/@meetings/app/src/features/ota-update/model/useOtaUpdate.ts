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

import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useOtaUpdate() {
  const { isUpdateAvailable, isUpdatePending, isDownloading } =
    Updates.useUpdates();
  const [isApplying, setIsApplying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const appState = useRef(AppState.currentState);

  // Subscribe to foreground events to check for app updates whenever the app
  // becomes active.
  useEffect(() => {
    if (!Updates.isEnabled) return;

    const subscription = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          next === "active"
        ) {
          Updates.checkForUpdateAsync().catch(() => {
            // Network hiccups are non-fatal; try again on the next foreground.
          });
        }
        appState.current = next;
      },
    );

    return () => subscription.remove();
  }, []);

  const applyUpdate = useCallback(async () => {
    try {
      setHasError(false);
      setIsApplying(true);

      if (!isUpdatePending) {
        await Updates.fetchUpdateAsync();
      }
      await Updates.reloadAsync();
    } catch {
      setHasError(true);
      setIsApplying(false);
    }
  }, [isUpdatePending]);

  return {
    isVisible: Updates.isEnabled && (isUpdateAvailable || isUpdatePending),
    isApplying: isApplying || isDownloading,
    hasError,
    applyUpdate,
  };
}
