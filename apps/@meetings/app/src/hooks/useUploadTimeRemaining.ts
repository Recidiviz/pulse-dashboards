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

import { formatDuration, intervalToDuration } from "date-fns";
import { useEffect, useRef, useState } from "react";

const SMOOTHING = 0.2;

function formatSecondsRemaining(secs: number): string {
  const duration = intervalToDuration({ start: 0, end: secs * 1000 });

  if (duration.days) return formatDuration({ days: duration.days });
  if (duration.hours) return formatDuration({ hours: duration.hours });
  if (duration.minutes) return formatDuration({ minutes: duration.minutes });
  return "< 1 min";
}

/**
 * Estimates time remaining for an upload based on a smoothed bytes-per-second speed.
 * Returns null until enough data has been observed to compute a speed.
 */
export function useUploadTimeRemaining(
  uploadedBytes: number,
  totalBytes: number,
): string | null {
  const prevRef = useRef<{ bytes: number; time: number } | null>(null);
  const speedRef = useRef<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();

    if (!prevRef.current) {
      prevRef.current = { bytes: uploadedBytes, time: now };
      return;
    }

    const dtSecs = (now - prevRef.current.time) / 1000;
    const dBytes = uploadedBytes - prevRef.current.bytes;

    if (dtSecs > 0 && dBytes > 0) {
      const instantSpeed = dBytes / dtSecs;
      speedRef.current =
        speedRef.current === null
          ? instantSpeed
          : SMOOTHING * instantSpeed + (1 - SMOOTHING) * speedRef.current;

      const remaining = totalBytes - uploadedBytes;
      const secsRemaining =
        remaining > 0 ? Math.ceil(remaining / speedRef.current) : 0;
      setTimeRemaining(formatSecondsRemaining(secsRemaining));
    }

    prevRef.current = { bytes: uploadedBytes, time: now };
  }, [uploadedBytes, totalBytes]);

  return timeRemaining;
}
