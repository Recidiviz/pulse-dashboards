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

import { useCallback, useRef, useState } from "react";

import { getItem, saveItem } from "~@meetings/app/utils/storage";

import { WEB_CHUNK_INTERVAL_MS } from "../constants";

export const useDurationTimer = () => {
  const [duration, setDuration] = useState(0);
  // for updating the duration state
  const intervalRef = useRef<number | null>(null);
  // for periodically saving duration to storage
  const saveIntervalRef = useRef<number | null>(null);
  // time when recording started, helps calculate elapsed time more accurately
  const startTimeRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setDuration(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      setDuration(elapsed);
    }, 1000);

    saveIntervalRef.current = window.setInterval(async () => {
      const durationMs = await getItem("durationMs");
      saveItem(
        "durationMs",
        (Number(durationMs) + WEB_CHUNK_INTERVAL_MS).toString(),
      );
    }, WEB_CHUNK_INTERVAL_MS);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    if (startTimeRef.current) {
      const finalDuration = Date.now() - startTimeRef.current;
      setDuration(finalDuration);
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setDuration(0);
    startTimeRef.current = null;
  }, [stopTimer]);

  return { duration, startTimer, stopTimer, resetTimer };
};
