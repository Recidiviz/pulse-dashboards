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

import { singleSentenceDateResourceSchema } from "~@jii/translation";

import { TFn } from "./types";

/**
 * i18next doesn't really support the concept of optional keys well,
 * but we rely on them for some display logic. This runs the translated object
 * through a Zod schema to produce a more useful output type.
 */
export function getDateCopy(t: TFn, dateId: string) {
  // we don't expect this parse to fail since the resources should already be validated
  return singleSentenceDateResourceSchema.parse(
    t(($) => $.sentenceDates.dates[dateId], { returnObjects: true }),
  );
}
