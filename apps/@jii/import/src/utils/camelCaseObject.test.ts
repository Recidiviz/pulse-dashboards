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

import { camelCaseObject } from "./camelCaseObject";

describe("camelCaseObject", () => {
  it("converts top-level snake_case keys", () => {
    expect(camelCaseObject({ foo_bar: 1, baz_qux: 2 })).toEqual({
      fooBar: 1,
      bazQux: 2,
    });
  });

  it("converts nested snake_case keys deeply", () => {
    expect(
      camelCaseObject({
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
      camelCaseObject({
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
      camelCaseObject({
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
    expect(camelCaseObject({ alreadyCamel: 1 })).toEqual({ alreadyCamel: 1 });
  });

  it("transforms non-snake_case keys that are not already camelCase", () => {
    expect(camelCaseObject({ ALLCAPS: 1 })).toEqual({ allcaps: 1 });
  });

  it("preserves primitive values", () => {
    expect(
      camelCaseObject({
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
    expect(camelCaseObject({})).toEqual({});
  });
});
