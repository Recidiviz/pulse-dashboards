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

import {
  LinkingOptions,
  NavigationContainerRefWithCurrent,
} from "@react-navigation/native";
import { useCallback, useEffect } from "react";

import { AppStackParamList } from "~@meetings/app/shared/config";

import { takePendingLoginDeepLink } from "./pendingLoginDeepLink";

// Restores a deep link captured before the login redirect (web only).
// Also returned for the container's onReady (either can fire last);
// takePendingLoginDeepLink clears the entry so only one attempt navigates.
export function useRestorePendingLoginDeepLink({
  loggedIn,
  navigationRef,
  linking,
}: {
  loggedIn: boolean;
  navigationRef: NavigationContainerRefWithCurrent<AppStackParamList>;
  linking: LinkingOptions<AppStackParamList>;
}): () => void {
  const restorePendingDeepLink = useCallback(() => {
    if (!loggedIn || !navigationRef.isReady()) return;
    const path = takePendingLoginDeepLink();
    if (!path) return;
    const state = linking.getStateFromPath?.(path, linking.config);
    if (state) {
      navigationRef.resetRoot(state);
    }
  }, [loggedIn, navigationRef, linking]);

  useEffect(() => {
    restorePendingDeepLink();
  }, [restorePendingDeepLink]);

  return restorePendingDeepLink;
}
