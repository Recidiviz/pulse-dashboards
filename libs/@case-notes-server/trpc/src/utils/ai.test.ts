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

import { describe, expect, test } from "vitest";

import { quoteFilterLiteral } from "~@case-notes-server/trpc/utils/ai";

describe("quoteFilterLiteral", () => {
  test("wraps a plain value in double quotes", () => {
    expect(quoteFilterLiteral("Check In")).toEqual('"Check In"');
  });

  test("escapes an embedded double quote", () => {
    expect(quoteFilterLiteral('a "quoted" word')).toEqual(
      '"a \\"quoted\\" word"',
    );
  });

  test("escapes backslashes", () => {
    expect(quoteFilterLiteral("C:\\notes\\")).toEqual('"C:\\\\notes\\\\"');
  });

  test("escapes backslashes before quotes so an attacker can't neutralize the escaping quote", () => {
    // If quotes were escaped before backslashes, an input ending in `\"`
    // would produce an escaped backslash followed by an unescaped,
    // filter-breaking quote instead of the correct fully-escaped pair.
    expect(quoteFilterLiteral('\\"')).toEqual('"\\\\\\""');
  });

  test("neutralizes an attempted filter injection", () => {
    const malicious = '") OR (1=1';
    const quoted = quoteFilterLiteral(malicious);
    expect(quoted).toEqual('"\\") OR (1=1"');
    // The escaped value must not contain an unescaped double quote, which
    // would let the input break out of its string literal.
    expect(quoted.slice(1, -1)).not.toMatch(/(?<!\\)"/);
  });
});
