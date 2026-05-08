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
  const startTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return;

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsedSinceStart = Date.now() - startTimeRef.current;
      setDurationMs(accumulatedMsRef.current + elapsedSinceStart);
    }, 100);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current === null) return null;

    clearInterval(intervalRef.current);
    intervalRef.current = null;

    const elapsedSinceStart = Date.now() - startTimeRef.current;
    const finalDuration = accumulatedMsRef.current + elapsedSinceStart;

    accumulatedMsRef.current = finalDuration;
    setDurationMs(finalDuration);

    return finalDuration;
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    accumulatedMsRef.current = 0;
    setDurationMs(0);
  }, []);

  const setInitialDurationMs = useCallback((ms: number) => {
    accumulatedMsRef.current = ms;
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
