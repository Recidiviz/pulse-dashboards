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

import {
  type CombinedSentenceDatesResources,
  type SentenceDatesCopyKey,
  singleSentenceDateResourceSchema,
} from "~@jii/translation";

import { TFn } from "./types";

type SectionCopy = Pick<
  CombinedSentenceDatesResources["sentenceDates"],
  "dates" | "general" | "toggle"
>;

/**
 * Returns the copy under copyKey, for use inside a t selector.
 */
export function sectionCopy(
  $: Record<SentenceDatesCopyKey, SectionCopy>,
  copyKey: SentenceDatesCopyKey,
) {
  return $[copyKey];
}

/**
 * i18next doesn't really support the concept of optional keys well,
 * but we rely on them for some display logic. This runs the translated object
 * through a Zod schema to produce a more useful output type.
 */
export function getDateCopy(
  t: TFn,
  dateId: string,
  copyKey: SentenceDatesCopyKey = "sentenceDates",
) {
  // we don't expect this parse to fail since the resources should already be validated
  return singleSentenceDateResourceSchema.parse(
    t(($) => sectionCopy($, copyKey).dates[dateId], { returnObjects: true }),
  );
}
