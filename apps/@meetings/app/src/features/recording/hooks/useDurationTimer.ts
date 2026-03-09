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

import { useCallback, useEffect, useRef, useState } from "react";

export function useDurationTimer() {
  const [durationMs, setDurationMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number | null>(null);
  // Ref mirror of durationMs to avoid stale closures in stop()
  const durationMsRef = useRef(0);

  const start = useCallback(() => {
    // No-op if already running
    if (intervalRef.current !== null) return;

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      // Use actual elapsed wall time rather than assuming exactly 1000ms per tick
      const elapsed = now - (lastTickRef.current ?? now);

      setDurationMs((prev) => {
        const next = prev + elapsed;
        durationMsRef.current = next;
        return next;
      });

      lastTickRef.current = now;
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (lastTickRef.current !== null) {
      // Capture the partial interval since the last tick
      const delta = Date.now() - lastTickRef.current;
      const finalDuration = durationMsRef.current + delta;

      durationMsRef.current = finalDuration;
      setDurationMs(finalDuration);
      lastTickRef.current = null;

      return finalDuration;
    }

    return null;
  }, []);

  const reset = useCallback(() => {
    stop();
    durationMsRef.current = 0;
    setDurationMs(0);
  }, [stop]);

  const setInitialDurationMs = useCallback((ms: number) => {
    durationMsRef.current = ms;
    setDurationMs(ms);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    durationMs,
    start,
    stop,
    reset,
    setInitialDurationMs,
  };
}
