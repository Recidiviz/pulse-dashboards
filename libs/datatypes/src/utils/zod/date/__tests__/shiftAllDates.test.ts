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

import tk from "timekeeper";
import { z } from "zod";

import { isDemoMode, isOfflineMode } from "~client-env-utils";

import {
  dateStringSchema,
  dateStringSchemaWithoutTimeShift,
} from "../dateStringSchema";
import {
  CURRENT_DATE_FIXTURE,
  CURRENT_DATE_STRING_FIXTURE,
} from "../fixtureDates";
import { shiftAllDates } from "../shiftAllDates";

vi.mock("~client-env-utils");

const testObj = {
  date: CURRENT_DATE_STRING_FIXTURE,
};

beforeEach(() => {
  tk.freeze(new Date(2025, 6, 8));
});

afterEach(() => {
  tk.reset();
});

test("unshifted dates are changed", () => {
  const schema = z.object({
    date: dateStringSchemaWithoutTimeShift,
  });

  expect(shiftAllDates(schema.parse(testObj))).toMatchInlineSnapshot(`
    {
      "date": 2025-07-08T00:00:00.000Z,
    }
  `);
});

test("dates where shifting is skipped are changed", () => {
  vi.mocked(isDemoMode).mockReturnValue(false);
  vi.mocked(isOfflineMode).mockReturnValue(false);

  const schema = z.object({
    date: dateStringSchema,
  });
  expect(shiftAllDates(schema.parse(testObj))).toMatchInlineSnapshot(`
    {
      "date": 2025-07-08T00:00:00.000Z,
    }
  `);
});

test("already shifted dates are unchanged", () => {
  vi.mocked(isDemoMode).mockReturnValue(true);
  vi.mocked(isOfflineMode).mockReturnValue(false);

  const schema = z.object({
    date: dateStringSchema,
  });

  const shiftedByParser = schema.parse(testObj);
  expect(shiftedByParser).toMatchInlineSnapshot(`
    {
      "date": 2025-07-08T00:00:00.000Z,
    }
  `);

  expect(shiftAllDates(shiftedByParser)).toEqual(shiftedByParser);
});

test("nested objects are shifted recursively", () => {
  const nestedTestObj = {
    date: CURRENT_DATE_FIXTURE,
    more: {
      otherDate: CURRENT_DATE_FIXTURE,
    },
  };

  expect(shiftAllDates(nestedTestObj)).toMatchInlineSnapshot(`
    {
      "date": 2025-07-08T00:00:00.000Z,
      "more": {
        "otherDate": 2025-07-08T00:00:00.000Z,
      },
    }
  `);
});
