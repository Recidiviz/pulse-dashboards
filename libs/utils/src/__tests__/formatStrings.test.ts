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

import {
  formatDate,
  formatName,
  getTicks,
  pluralize,
  pluralizeWord,
  stripUriSchemes,
} from "../formatStrings";

describe("formatDate", () => {
  it("returns 'Unknown' when date is undefined", () => {
    expect(formatDate(undefined)).toBe("Unknown");
  });

  it("returns 'Unknown' when date is null", () => {
    expect(formatDate(null)).toBe("Unknown");
  });

  it("returns 'Unknown' when date is invalid", () => {
    expect(formatDate(new Date("bad_date_string"))).toBe("Unknown");
  });

  it("formats a date with the default pattern", () => {
    const date = new Date(2024, 0, 15);
    expect(formatDate(date)).toBe("1/15/24");
  });

  it("formats a date with a custom pattern", () => {
    const date = new Date(2024, 0, 15);
    expect(formatDate(date, "MMMM dd, yyyy")).toBe("January 15, 2024");
  });
});

describe("pluralizeWord", () => {
  it("pluralizes based on count", () => {
    expect(pluralizeWord({ term: "violation", count: 2 })).toBe("violations");
    expect(pluralizeWord({ term: "violation", count: 1 })).toBe("violation");
  });

  it("just appends s when justAppendS is true", () => {
    expect(pluralizeWord({ term: "item", justAppendS: true })).toBe("items");
  });

  it("uses Pluralize library when no count or justAppendS", () => {
    expect(pluralizeWord({ term: "person" })).toBe("people");
  });
});

describe("formatName", () => {
  it("formats a 'firstName lastName' correctly", () => {
    expect(formatName("Barney Rubble")).toBe("B. Rubble");
  });

  it("formats a 'firstName middleInitial lastName' correctly", () => {
    expect(formatName("Barney J. Rubble")).toBe("B. Rubble");
  });

  it("formats a name with more than 10 character last name correctly", () => {
    expect(formatName("Barney Rubbbbbbble")).toBe("B. Rubbbbbbbl...");
  });
});

describe("getTicks", () => {
  it("returns empty tick values for -Infinity", () => {
    const result = getTicks(-Infinity);
    expect(result.tickValues).toEqual([]);
  });

  it("returns fractional tick values for values less than 1", () => {
    const result = getTicks(0.5);
    expect(result.tickValues).toEqual([0.2, 0.4, 0.6, 0.8]);
  });

  it("returns computed ticks for normal values", () => {
    const result = getTicks(100);
    expect(result.maxTickValue).toBe(100);
    expect(result.tickValues).toEqual([0, 20, 40, 60, 80, 100]);
    expect(result.ticksMargin).toBeGreaterThanOrEqual(50);
  });

  it("returns a minimum ticksMargin of 50", () => {
    const result = getTicks(5);
    expect(result.ticksMargin).toBeGreaterThanOrEqual(50);
  });
});

describe("pluralize", () => {
  it("does not pluralize when count is 1", () => {
    expect(pluralize(1, "violation")).toBe("1 violation");
  });

  it("pluralizes when count is not 1", () => {
    expect(pluralize(2, "violation")).toBe("2 violations");
    expect(pluralize(0, "violation")).toBe("0 violations");
  });
});

describe("stripUriSchemes", () => {
  it("strips https:// from a URL", () => {
    expect(stripUriSchemes("Visit https://example.com for info")).toBe(
      "Visit example.com for info",
    );
  });

  it("strips http:// from a URL", () => {
    expect(stripUriSchemes("Visit http://example.com for info")).toBe(
      "Visit example.com for info",
    );
  });

  it("strips multiple URI schemes in the same string", () => {
    expect(
      stripUriSchemes("See https://example.com and http://foo.org/bar"),
    ).toBe("See example.com and foo.org/bar");
  });

  it("strips non-http(s) schemes like ftp://", () => {
    expect(stripUriSchemes("Download from ftp://files.example.com")).toBe(
      "Download from files.example.com",
    );
  });

  it("leaves text without a URI scheme unchanged", () => {
    expect(stripUriSchemes("No links here, just text.")).toBe(
      "No links here, just text.",
    );
  });

  it("does not strip scheme-like text with no following non-whitespace", () => {
    expect(stripUriSchemes("weird case:// ")).toBe("weird case:// ");
  });

  it("preserves the rest of the URL so it's still readable", () => {
    expect(stripUriSchemes("https://example.com/path?query=1#hash")).toBe(
      "example.com/path?query=1#hash",
    );
  });
});
