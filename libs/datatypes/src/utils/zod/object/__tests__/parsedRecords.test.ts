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

import { z } from "zod";

import { ParsedRecord } from "../../../types";
import { makeRecordFixture } from "../makeRecordFixture";
import {
  inputFixture,
  inputFixtureArray,
  outputFixture,
  outputFixtureArray,
} from "../parsedRecords";

const testSchema = z.object({ foo: z.string().toUpperCase() });
let testFixture: ParsedRecord<typeof testSchema>;

beforeEach(() => {
  testFixture = makeRecordFixture(testSchema, { foo: "bar" });
});

test("inputFixture", () => {
  expect(inputFixture(testFixture)).toEqual(testFixture.input);
});

test("outputFixture", () => {
  expect(outputFixture(testFixture)).toEqual(testFixture.output);
});

describe("fixture arrays", () => {
  let fixtures: Array<ParsedRecord<typeof testSchema>>;

  beforeEach(() => {
    fixtures = [testFixture, makeRecordFixture(testSchema, { foo: "blerg" })];
  });

  test("input", () => {
    expect(inputFixtureArray(fixtures)).toEqual(fixtures.map((f) => f.input));
  });

  test("output", () => {
    expect(outputFixtureArray(fixtures)).toEqual(fixtures.map((f) => f.output));
  });
});
