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

import { describe, expect, it } from "vitest";

import { camelCaseImportRecord } from "./camelCaseImportRecord";

describe("camelCaseImportRecord", () => {
  it("converts top-level snake_case keys", () => {
    expect(camelCaseImportRecord({ foo_bar: 1, baz_qux: 2 })).toEqual({
      fooBar: 1,
      bazQux: 2,
    });
  });

  it("converts nested snake_case keys deeply", () => {
    expect(
      camelCaseImportRecord({
        top_level: {
          second_level: {
            third_level: "value",
          },
        },
      }),
    ).toEqual({
      topLevel: {
        secondLevel: {
          thirdLevel: "value",
        },
      },
    });
  });

  it("converts keys in objects nested inside arrays", () => {
    expect(
      camelCaseImportRecord({
        some_list: [
          { item_id: 1, item_name: "a" },
          { item_id: 2, item_name: "b" },
        ],
      }),
    ).toEqual({
      someList: [
        { itemId: 1, itemName: "a" },
        { itemId: 2, itemName: "b" },
      ],
    });
  });

  it("converts keys in deeply nested arrays of objects", () => {
    expect(
      camelCaseImportRecord({
        outer_key: [
          {
            inner_key: [{ deep_key: true }],
          },
        ],
      }),
    ).toEqual({
      outerKey: [
        {
          innerKey: [{ deepKey: true }],
        },
      ],
    });
  });

  it("does not mangle existing camelCase keys", () => {
    expect(camelCaseImportRecord({ alreadyCamel: 1 })).toEqual({
      alreadyCamel: 1,
    });
  });

  it("transforms non-snake_case keys that are not already camelCase", () => {
    expect(camelCaseImportRecord({ ALLCAPS: 1 })).toEqual({ allcaps: 1 });
  });

  it("preserves primitive values", () => {
    expect(
      camelCaseImportRecord({
        a_string: "hello",
        a_number: 42,
        a_bool: true,
        a_null: null,
      }),
    ).toEqual({
      aString: "hello",
      aNumber: 42,
      aBool: true,
      aNull: null,
    });
  });

  it("handles an empty object", () => {
    expect(camelCaseImportRecord({})).toEqual({});
  });

  // The cases below pin behavior that a hand-rolled object traversal could silently get wrong;
  // they guard against regressions from changing the traversal logic or the string conversion util

  it("leaves values that are not plain objects intact", () => {
    // a naive traversal rebuilds these as bare objects, destroying them
    const date = new Date("2024-01-01T00:00:00Z");
    expect(camelCaseImportRecord({ some_date: date })).toEqual({
      someDate: date,
    });
  });

  it("converts keys containing digits", () => {
    expect(
      camelCaseImportRecord({ foo_1: 1, ercd_date_v2: 2, a_2b: 3, x1_y2: 4 }),
    ).toEqual({ foo1: 1, ercdDateV2: 2, a2B: 3, x1Y2: 4 });
  });

  it("handles unconventional separators and casing", () => {
    expect(camelCaseImportRecord({ "foo-bar": 1 })).toEqual({ fooBar: 1 });
    expect(camelCaseImportRecord({ "foo bar": 1 })).toEqual({ fooBar: 1 });
    expect(camelCaseImportRecord({ FooBar: 1 })).toEqual({ fooBar: 1 });
    expect(camelCaseImportRecord({ foo__bar: 1 })).toEqual({ fooBar: 1 });
    expect(camelCaseImportRecord({ foo_bar_: 1 })).toEqual({ fooBar: 1 });
  });

  it("preserves a leading underscore", () => {
    expect(camelCaseImportRecord({ _foo_bar: 1 })).toEqual({ _fooBar: 1 });
  });

  it("converts unicode keys", () => {
    expect(camelCaseImportRecord({ ünïcode_kèy: 1 })).toEqual({
      ünïcodeKèy: 1,
    });
  });

  it("preserves arrays of primitives", () => {
    expect(
      camelCaseImportRecord({ some_list: [1, "two", null, true] }),
    ).toEqual({
      someList: [1, "two", null, true],
    });
  });

  it("converts keys on objects with a null prototype", () => {
    const input = Object.assign(Object.create(null), { foo_bar: 1 });
    expect(camelCaseImportRecord(input)).toEqual({ fooBar: 1 });
  });

  it("does not let a __proto__ key set the prototype", () => {
    // JSON.parse is the only way to get __proto__ as an own key; an object literal would
    // set the prototype at parse time and leave nothing to convert
    const parsed = JSON.parse(
      '{"__proto__": {"polluted": true}, "state_code": "US_XX"}',
    );

    const result = camelCaseImportRecord(parsed);

    // the conversion renames it to a harmless key rather than dropping it;
    // what matters is that the prototype is untouched
    expect(result).toEqual({ __proto: { polluted: true }, stateCode: "US_XX" });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect({}).not.toHaveProperty("polluted");
  });

  it("never converts any spelling of __proto__ back to __proto__", () => {
    /*
     * With no guard in convertDeeply, this property is the only thing keeping such a key from
     * setting the prototype of the object being built: the conversion has to rename every
     * spelling to something harmless. If a camelcase upgrade changes that, this fails, and a
     * guard needs to go back in before the upgrade lands.
     *
     * These go through JSON.parse because an object literal would apply __proto__ as the
     * prototype at construction time, leaving no own key to convert.
     */
    for (const key of [
      "__proto__",
      "_proto_",
      "--proto--",
      "__proto__ ",
      " __proto__",
    ]) {
      const parsed = JSON.parse(`{${JSON.stringify(key)}: {"polluted": true}}`);
      const result = camelCaseImportRecord(parsed);

      expect(Object.keys(result)).not.toContain("__proto__");
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    }
  });
});
