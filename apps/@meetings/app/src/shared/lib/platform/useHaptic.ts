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

import * as Haptics from "expo-haptics";
import { useCallback, useMemo } from "react";
import { Platform } from "react-native";

export type HapticType = "success" | "neutral" | "warning" | "error";

const hapticsSupported = () =>
  Platform.OS === "ios" || Platform.OS === "android";

function playHaptic(type: HapticType) {
  switch (type) {
    case "success":
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    case "warning":
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
    case "error":
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    case "neutral":
      return Haptics.selectionAsync();
  }
}

export function useHaptic() {
  const trigger = useCallback((type: HapticType) => {
    if (!hapticsSupported()) return;

    try {
      playHaptic(type)?.catch(() => undefined);
    } catch {
      // nothing -- on desktop
    }
  }, []);

  return useMemo(
    () => ({
      trigger,
      success: () => trigger("success"),
      neutral: () => trigger("neutral"),
      warning: () => trigger("warning"),
      error: () => trigger("error"),
    }),
    [trigger],
  );
}
