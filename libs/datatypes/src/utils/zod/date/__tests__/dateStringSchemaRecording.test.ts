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

import tk from "timekeeper";
import { z } from "zod";

import { setDateshift, withDateshift } from "../dateshift";
import { collectShiftedDates } from "../dateShiftRecorder";
import {
  dateStringSchema,
  dateStringSchemaWithoutTimeShift,
} from "../dateStringSchema";
import { CURRENT_DATE_STRING_FIXTURE } from "../fixtureDates";

const testDate = new Date(2024, 2, 25);

beforeEach(() => {
  setDateshift(false);
  tk.freeze(testDate);
});

afterEach(() => {
  tk.reset();
});

test("records nothing when dateshift is off", () => {
  const schema = z.object({ d: dateStringSchema });

  const { shiftedDates } = collectShiftedDates(() =>
    schema.parse({ d: CURRENT_DATE_STRING_FIXTURE }),
  );

  expect(shiftedDates).toEqual([]);
});

test("records the shifted value when dateshift is on", () => {
  const schema = z.object({ d: dateStringSchema });

  const { result, shiftedDates } = withDateshift(() =>
    collectShiftedDates(() => schema.parse({ d: CURRENT_DATE_STRING_FIXTURE })),
  );

  expect(shiftedDates).toEqual([{ path: ["d"], value: testDate }]);
  // what was recorded is what the schema actually returned
  expect(result.d).toEqual(shiftedDates[0].value);
});

test("records nothing for dateStringSchemaWithoutTimeShift", () => {
  const schema = z.object({
    shifted: dateStringSchema,
    notShifted: dateStringSchemaWithoutTimeShift,
  });

  const { shiftedDates } = withDateshift(() =>
    collectShiftedDates(() =>
      schema.parse({
        shifted: CURRENT_DATE_STRING_FIXTURE,
        notShifted: CURRENT_DATE_STRING_FIXTURE,
      }),
    ),
  );

  expect(shiftedDates).toEqual([{ path: ["shifted"], value: testDate }]);
});

test("reports paths for nested objects, arrays of objects and bare date arrays", () => {
  const schema = z.object({
    top: dateStringSchema,
    nested: z.object({ inner: dateStringSchema }),
    list: z.array(z.object({ d: dateStringSchema })),
    bareList: z.array(dateStringSchema),
    absent: dateStringSchema.optional(),
  });

  const { shiftedDates } = withDateshift(() =>
    collectShiftedDates(() =>
      schema.parse({
        top: CURRENT_DATE_STRING_FIXTURE,
        nested: { inner: CURRENT_DATE_STRING_FIXTURE },
        list: [
          { d: CURRENT_DATE_STRING_FIXTURE },
          { d: CURRENT_DATE_STRING_FIXTURE },
        ],
        bareList: [CURRENT_DATE_STRING_FIXTURE, CURRENT_DATE_STRING_FIXTURE],
      }),
    ),
  );

  expect(shiftedDates.map(({ path }) => path)).toEqual([
    ["top"],
    ["nested", "inner"],
    ["list", 0, "d"],
    ["list", 1, "d"],
    ["bareList", 0],
    ["bareList", 1],
  ]);
});

test("reports paths relative to the root of the parse that started the collection", () => {
  const inner = z.object({ d: dateStringSchema });
  const outer = z.object({ wrapped: inner });

  // collecting around the inner schema's own parse yields inner-relative paths,
  // which is what lets applyShiftedDates write back into the object it parsed
  const { shiftedDates } = withDateshift(() =>
    collectShiftedDates(() => inner.parse({ d: CURRENT_DATE_STRING_FIXTURE })),
  );
  expect(shiftedDates.map(({ path }) => path)).toEqual([["d"]]);

  const { shiftedDates: fromOuter } = withDateshift(() =>
    collectShiftedDates(() =>
      outer.parse({ wrapped: { d: CURRENT_DATE_STRING_FIXTURE } }),
    ),
  );
  expect(fromOuter.map(({ path }) => path)).toEqual([["wrapped", "d"]]);
});
