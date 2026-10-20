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

import * as Sentry from "@sentry/react-native";
import { useEffect } from "react";

import { useActiveMeetingStore } from "./activeMeetingStore";

/**
 * A hook that holds a Screen Wake Lock (on web only) whenever "enabled" is true
 */
export function useScreenWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const meetingId = useActiveMeetingStore.getState().meetingId;

    if (!("wakeLock" in navigator)) {
      Sentry.logger.warn("recording.wake_lock.unsupported", { meetingId });
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let requesting = false;
    let disposed = false;

    const acquire = async () => {
      if (requesting || (sentinel && !sentinel.released)) return;

      requesting = true;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (disposed) {
          await lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener("release", () => {
          Sentry.logger.info("recording.wake_lock.released", {
            meetingId,
            visibilityState: document.visibilityState,
          });
        });
        Sentry.logger.info("recording.wake_lock.acquired", { meetingId });
      } catch (err) {
        Sentry.logger.warn("recording.wake_lock.refused", {
          meetingId,
          error: String(err),
        });
      } finally {
        requesting = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        acquire();
      }
    };

    acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel?.release();
    };
  }, [enabled]);
}
