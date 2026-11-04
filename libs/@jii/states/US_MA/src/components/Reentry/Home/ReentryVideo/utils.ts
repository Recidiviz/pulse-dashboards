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

// Played ranges stop on frame boundaries, so even a full viewing can add up to
// a few milliseconds short of the duration.
const UNPLAYED_TOLERANCE_SECONDS = 0.5;

/** Returns the video's current position, rounded to whole seconds. */
export function getPositionSeconds({ currentTime }: { currentTime: number }) {
  return Math.round(currentTime);
}

/**
 * Returns whether every part of the video has been played.
 *
 * The browser records which parts have played in `played`, a TimeRanges of
 * start and end times in seconds, read by index with played.start(i) and
 * played.end(i). Playing on extends the current part, jumping to a spot that
 * hasn't played starts a new one, and parts that come to overlap are merged.
 * Adding up their lengths gives how much of the video has been seen: skipping
 * ahead leaves a gap, and replaying a part doesn't count it twice.
 */
export function hasWatchedWholeVideo({
  played,
  duration,
}: {
  played: TimeRanges;
  duration: number;
}) {
  let playedSeconds = 0;
  for (
    let timeRangeIndex = 0;
    timeRangeIndex < played.length;
    timeRangeIndex++
  ) {
    playedSeconds += played.end(timeRangeIndex) - played.start(timeRangeIndex);
  }
  return playedSeconds >= duration - UNPLAYED_TOLERANCE_SECONDS;
}
