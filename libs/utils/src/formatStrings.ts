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

import { format } from "date-fns";
import ceil from "lodash/ceil";
import Pluralize from "pluralize";

export function formatDate(date?: Date | null, pattern = "M/d/yy"): string {
  if (!date) return "Unknown";
  return format(date, pattern);
}

/**
 * @returns appropriately singular or plural form of `term` including irregular terms
 */
export const pluralizeWord = ({
  term,
  count,
  justAppendS = false,
}: {
  term: string;
  count?: number;
  justAppendS?: boolean;
}): string => {
  if (count) return Pluralize(term, count);
  if (justAppendS) return `${term}s`;
  return Pluralize(term);
};

/**
 * @returns `count` with appropriately singular or plural form of `term`
 */
export const pluralize = (count: number, term: string): string => {
  return `${count} ${pluralizeWord({ term, count })}`;
};

export function formatName(fullName: string): string {
  const LAST_NAME_CHARACTER_LIMIT = 10;
  const names = fullName.split(" ");
  const firstInitial = names[0][0];
  const lastName = names[names.length - 1];

  return `${firstInitial}. ${
    lastName.length > LAST_NAME_CHARACTER_LIMIT
      ? `${lastName.slice(0, LAST_NAME_CHARACTER_LIMIT)}...`
      : lastName
  }`;
}

export const getTicks = (
  value: number,
): { maxTickValue: number; tickValues: number[]; ticksMargin: number } => {
  const precision = Math.floor(Math.log10(value));
  const max = ceil(value, precision >= 2 ? -precision + 1 : -precision);
  let ticksCount = 0;
  if (max % 5 === 0) {
    ticksCount = 5;
  } else if (max % 4 === 0) {
    ticksCount = 4;
  } else if (max % 3 === 0) {
    ticksCount = 3;
  } else {
    ticksCount = 2;
  }

  const ticks = Array.from({ length: ticksCount + 1 }, (_, i) =>
    Math.round((max / ticksCount) * i),
  );

  const getMarginFactor = (n: number, isFloat: boolean) => {
    if (n <= 2) {
      return isFloat ? 4 : 2.2;
    }
    return 1;
  };

  let tickValues: number[];
  switch (true) {
    case value === -Infinity:
      tickValues = [];
      break;
    case value < 1:
      tickValues = [0.2, 0.4, 0.6, 0.8];
      break;
    default:
      tickValues = ticks;
  }

  return {
    maxTickValue: max,
    tickValues,
    ticksMargin: Math.max(
      (max.toString().length +
        getMarginFactor(max.toString().length, ticks[1] % 1 !== 0)) *
        10,
      50,
    ),
  };
};
