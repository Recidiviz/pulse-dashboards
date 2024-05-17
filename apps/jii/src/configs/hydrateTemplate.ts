// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { toTitleCase } from "@artsy/to-title-case";
import { isFuture } from "date-fns";
import Handlebars from "handlebars";

import { dateStringSchema } from "~datatypes";

import { formatFullDate } from "../utils/date";

Handlebars.registerHelper("titleCase", (s: string) => toTitleCase(s));
Handlebars.registerHelper("lowerCase", (s: string) => s.toLowerCase());
Handlebars.registerHelper("formatFullDate", (d: Date | string) => {
  const dateToFormat = d instanceof Date ? d : dateStringSchema.parse(d);
  return formatFullDate(dateToFormat);
});
Handlebars.registerHelper("isFutureDate", (d: Date) => isFuture(d));
Handlebars.registerHelper("and", (a: unknown, b: unknown) => a && b);
Handlebars.registerHelper("equals", (a: unknown, b: unknown) => a === b);

/**
 * Hydrates the Handlebars template in `template` with the values in `context`.
 */
export function hydrateTemplate(
  template: string,
  context: Record<string, unknown>,
) {
  return Handlebars.compile(template)(context);
}

/**
 * Handlebars templates may have extra whitespace for readability;
 * this condenses all that to single spaces and a single line
 * with no leading or trailing spaces
 */
export function cleanupInlineTemplate(s: string) {
  return s.replaceAll(/\s+/g, " ").trim();
}
