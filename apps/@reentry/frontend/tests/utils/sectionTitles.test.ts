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

import { getSectionTitles } from "../../app/utils/sectionTitles";

describe("getSectionTitles", () => {
  it("returns actionable H1 titles in order", () => {
    expect(
      getSectionTitles(
        "# Housing Stability\n\nsome text\n# Employment Readiness",
      ),
    ).toEqual(["Housing Stability", "Employment Readiness"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(getSectionTitles("")).toEqual([]);
  });

  it("returns an empty array when there are no H1 headings", () => {
    expect(getSectionTitles("## Not H1\n\nJust paragraph text.")).toEqual([]);
  });

  it("ignores H2 and deeper headings", () => {
    expect(
      getSectionTitles("# Housing Stability\n## Short-Term\n### Step 1"),
    ).toEqual(["Housing Stability"]);
  });

  it("trims extra whitespace from titles", () => {
    expect(getSectionTitles("#  Padded Title  ")).toEqual(["Padded Title"]);
  });

  it("does not match # that appears mid-line", () => {
    expect(
      getSectionTitles("Some text # not a heading\n# Housing Stability"),
    ).toEqual(["Housing Stability"]);
  });

  it("filters out overview sections", () => {
    expect(
      getSectionTitles("# Overview of the action plan\n# Housing Stability"),
    ).toEqual(["Housing Stability"]);
  });

  it("filters out immediate need sections", () => {
    expect(
      getSectionTitles("# Immediate Need\n# Employment Readiness"),
    ).toEqual(["Employment Readiness"]);
  });

  it("filters out quick summary of circumstances sections", () => {
    expect(
      getSectionTitles(
        "# Quick summary of circumstances\n# Financial Stability",
      ),
    ).toEqual(["Financial Stability"]);
  });

  it("filters non-actionable sections case-insensitively", () => {
    expect(
      getSectionTitles("# OVERVIEW\n# IMMEDIATE NEED\n# Healthcare Access"),
    ).toEqual(["Healthcare Access"]);
  });
});
