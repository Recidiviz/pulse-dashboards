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

// Web measures loudness as linear RMS amplitude while native (expo-audio)
// reports dBFS metering. To make both platforms emit the same 0–1 audio level
// for the same loudness, we convert everything to dBFS and normalize against a
// shared range.

// Loudness floor: at or below this we report 0 (treated as silence).
const AUDIO_LEVEL_FLOOR_DB = -50;
// Loudness ceiling: at or above this we report a full 1.
// Lowered from -10 to -25 so quiet voices occupy more of the 0–1 range.
const AUDIO_LEVEL_CEIL_DB = -25;
// Gamma < 1 boosts mid-low values (quiet voice feels more responsive).
const AUDIO_LEVEL_GAMMA = 0.4;

/** Normalize a dBFS value to a 0–1 audio level. */
export function dbToAudioLevel(db: number) {
  if (!Number.isFinite(db)) return 0;
  const normalized =
    (db - AUDIO_LEVEL_FLOOR_DB) / (AUDIO_LEVEL_CEIL_DB - AUDIO_LEVEL_FLOOR_DB);
  return Math.pow(Math.min(1, Math.max(0, normalized)), AUDIO_LEVEL_GAMMA);
}

/** Convert a linear RMS amplitude (0–1) to a normalized 0–1 audio level. */
export function rmsToAudioLevel(rms: number) {
  if (rms <= 0) return 0;
  return dbToAudioLevel(20 * Math.log10(rms));
}
