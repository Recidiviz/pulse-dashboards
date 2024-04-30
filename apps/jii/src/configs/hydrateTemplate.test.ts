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

import { parseISO } from "date-fns";

import { relativeFixtureDate } from "~datatypes";

import { hydrateTemplate } from "./hydrateTemplate";

test("hydrate template supports Handlebars syntax", () => {
  expect(
    hydrateTemplate("{{greeting}} world", { greeting: "hello" }),
  ).toMatchInlineSnapshot(`"hello world"`);

  expect(
    hydrateTemplate("Hello {{#if name}}{{name}}{{else}}there{{/if}}!", {}),
  ).toMatchInlineSnapshot(`"Hello there!"`);
});

describe("helpers", () => {
  test("titleCase", () => {
    expect(
      hydrateTemplate("{{titleCase input}}", { input: "hello world" }),
    ).toBe("Hello World");

    // internal capitals cause a word to be ignored
    ["HELLO WORLD", "heLLo WOrld"].forEach((input) => {
      expect(hydrateTemplate("{{titleCase input}}", { input })).toBe(input);
    });
  });

  test("lowerCase", () => {
    ["HELLO WORLD", "heLLo WOrld", "Hello World"].forEach((input) => {
      expect(hydrateTemplate("{{lowerCase input}}", { input })).toBe(
        "hello world",
      );
    });
  });

  test("formatFullDate", () => {
    expect(
      hydrateTemplate("{{formatFullDate input}}", {
        input: new Date(2025, 0, 17),
      }),
    ).toBe("January 17, 2025");
  });

  test("isFutureDate", () => {
    const futureDate = parseISO(relativeFixtureDate({ years: 1 }));
    const pastDate = parseISO(relativeFixtureDate({ years: -1 }));
    const template = "{{#if (isFutureDate date)}}future{{else}}past{{/if}}";

    expect(hydrateTemplate(template, { date: futureDate })).toBe("future");
    expect(hydrateTemplate(template, { date: pastDate })).toBe("past");
  });
});
