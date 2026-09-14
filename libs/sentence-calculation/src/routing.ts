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
 * The root URL segment for the Sentence Calculation feature. Owned here rather
 * than in the staff app's `views.ts` so that the feature's routes travel with
 * the feature; `views.ts` imports this the same way it imports `psiRootPath`
 * from `~sentencing-client`.
 */
export const sentenceCalculationRootPath = "sentenceCalculation";

export const SENTENCE_CALCULATION_PATHS = {
  sentenceCalculation: `/${sentenceCalculationRootPath}`,
} as const;
