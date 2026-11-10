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

/**
 * The size of the provider network the application is reviewed against. This is
 * a fixed, decorative value — it does NOT reflect real match data or the live
 * provider count. Update it here (and only here) if the network size changes.
 */
export const PROVIDER_NETWORK_SIZE = 72;

/** Grid layout for the scanning animation (6 columns x 3 rows = 18 dots). */
export const GRID_COLUMNS = 6;
export const GRID_ROWS = 3;
export const GRID_DOT_COUNT = GRID_COLUMNS * GRID_ROWS;

/**
 * Dots that resolve to a full-pine "match" with a checkmark as the beam passes.
 * These positions are hard-coded decoration — they are not real matches.
 */
export const MATCH_DOT_INDICES = [4, 9, 15];

/** Timeline (ms). The beam sweeps, then the counter finishes, then we hold. */
export const SWEEP_START_MS = 970;
export const SWEEP_DURATION_MS = 2300;
export const BEAM_FADE_DURATION_MS = 400;
export const DONE_APPEAR_MS = SWEEP_START_MS + SWEEP_DURATION_MS;
export const DONE_RISE_DURATION_MS = 450;

/** How long "Search complete" stays on screen before the modal closes. */
export const DONE_HOLD_MS = 1000;

/** Total one-shot length: sweep, then the hold on "Search complete". */
export const TOTAL_DURATION_MS = DONE_APPEAR_MS + DONE_HOLD_MS;
export const MATCHING_MODAL_WIDTH = "clamp(0rem, 96vw, 34rem)";
export const MATCHING_MODAL_HEIGHT = "min(30rem, 92dvh)";
/**
 * The moment the beam's center passes a given column, as a fraction (0-1) of
 * the sweep. Used to stagger when each dot in that column lights up.
 */
export const columnCenterFraction = (columnIndex: number): number =>
  (columnIndex + 0.5) / GRID_COLUMNS;
