// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { appendDateSuffixIfMissing } from "../../utils";

/**
 * This function handles formatting cases where `supervisionEndDateCopy` contains the word "Supervision" or "Date"
 * to ensure the final string phrase reads "Supervision <custom end date copy> Date" without word duplication.
 * For example:
 *   - if `supervisionEndDateCopy` is "Termination Date", the phrase will be "Supervision Termination Date".
 *   - if `supervisionEndDateCopy` is "End", the phrase will be "Supervision End Date".
 *   - if `supervisionEndDateCopy` is "Supervision End Date", the phrase will be "Supervision End Date".
 */
export const formatSupervisionEndDatePhrase = (endDateCopy: string): string => {
  const needsSupervisionPrefix = !/\bsupervision\b/i.test(endDateCopy);
  const supervisionPrefix = needsSupervisionPrefix ? "Supervision " : "";
  return `${supervisionPrefix}${appendDateSuffixIfMissing(endDateCopy)}`;
};
