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
 * CSS class applied to non-splittable report blocks. Queried by the PDF
 * generator to snap page cuts to block boundaries instead of splitting mid-card.
 */
export const NO_SPLIT_CLASS = "sar-no-split";

/** Vertical gap between top-level report blocks (sections, charge cards). */
export const BLOCK_GAP = 30;

/** Vertical gap between label-value field rows inside a charge card. */
export const FIELD_ROW_GAP = 4;

/** Horizontal gap between officer info columns in the Requested Of section. */
export const SECTION_COLUMN_GAP = 16;

/** Horizontal gap between client identifier chips. */
export const CHIP_GAP = 10;

/** Left padding applied to each column in the charge card body. */
export const CHARGE_COLUMN_PADDING = 10;
