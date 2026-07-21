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

import { Monaco } from "@monaco-editor/react";
import { parseDocument } from "yaml";

import { AgencyConfigFileSchema } from "~@meetings/config";

import {
  computeMarkers,
  findRange,
  parseVersion,
  pathToString,
} from "./configValidation";

// computeMarkers only reads monaco.MarkerSeverity.Error, so a minimal stub
// stands in for the full Monaco instance.
const fakeMonaco = { MarkerSeverity: { Error: 8 } } as unknown as Monaco;

function assertRange(
  range: [number, number] | null,
): asserts range is [number, number] {
  expect(range).not.toBeNull();
}

describe("pathToString", () => {
  it("joins plain object segments with dots", () => {
    expect(pathToString(["name", "stateCode"])).toBe("name.stateCode");
  });

  it("renders numeric segments as array indices", () => {
    expect(pathToString(["meetingTypes", 0, "type"])).toBe(
      "meetingTypes[0].type",
    );
  });

  it("handles a leading numeric segment without a leading dot", () => {
    expect(pathToString([0, "type"])).toBe("[0].type");
  });

  it("returns an empty string for an empty path", () => {
    expect(pathToString([])).toBe("");
  });
});

describe("findRange", () => {
  it("returns the exact range when the path exists", () => {
    const doc = parseDocument("name: hello\nversion: 1\n");

    const range = findRange(doc, ["name"]);

    assertRange(range);
    const [start, end] = range;
    expect(doc.toString().slice(start, end)).toBe("hello");
  });

  it("walks up to the nearest existing ancestor when the leaf is missing", () => {
    const doc = parseDocument("meetingTypes:\n  - type: Assessment\n");

    const range = findRange(doc, ["meetingTypes", 0, "categoryType"]);

    assertRange(range);
    const [start, end] = range;
    // Falls back to a single character at the start of meetingTypes[0].
    expect(end - start).toBe(1);
    expect(doc.toString().slice(start, end)).toBe("t");
  });

  it("falls back to the document root when nothing in the path exists", () => {
    const doc = parseDocument("name: hello\n");

    const range = findRange(doc, ["stateCode"]);

    assertRange(range);
    const [start, end] = range;
    expect(end - start).toBe(1);
    expect(start).toBe(0);
  });

  it("returns null for an empty document", () => {
    const doc = parseDocument("");

    expect(findRange(doc, ["name"])).toBeNull();
  });
});

describe("computeMarkers", () => {
  it("returns no markers for a valid config", () => {
    const text = "name: Test Agency\nstateCode: US_XX\nversion: 2\n";

    const markers = computeMarkers(
      fakeMonaco,
      text,
      AgencyConfigFileSchema,
      null,
    );

    expect(markers).toEqual([]);
  });

  it("reports a YAML syntax error", () => {
    const text = "name: [unterminated\n";

    const markers = computeMarkers(
      fakeMonaco,
      text,
      AgencyConfigFileSchema,
      null,
    );

    expect(markers.length).toBeGreaterThan(0);
    expect(markers[0].severity).toBe(fakeMonaco.MarkerSeverity.Error);
  });

  it("reports a missing required field", () => {
    const text = "stateCode: US_XX\nversion: 1\n";

    const markers = computeMarkers(
      fakeMonaco,
      text,
      AgencyConfigFileSchema,
      null,
    );

    expect(markers).toHaveLength(1);
    expect(markers[0].message).toBe('Missing required field "name"');
  });

  it("reports a schema type mismatch", () => {
    const text =
      'name: Test Agency\nstateCode: US_XX\nversion: "not-a-number"\n';

    const markers = computeMarkers(
      fakeMonaco,
      text,
      AgencyConfigFileSchema,
      null,
    );

    expect(markers).toHaveLength(1);
    expect(markers[0].message).toContain('"version"');
  });

  it("reports when the version has not been increased past minVersion", () => {
    const text = "name: Test Agency\nstateCode: US_XX\nversion: 2\n";

    const markers = computeMarkers(fakeMonaco, text, AgencyConfigFileSchema, 2);

    expect(markers).toHaveLength(1);
    expect(markers[0].message).toBe(
      "Version must be increased from 2 before saving (currently 2)",
    );
  });

  it("allows a version strictly greater than minVersion", () => {
    const text = "name: Test Agency\nstateCode: US_XX\nversion: 3\n";

    const markers = computeMarkers(fakeMonaco, text, AgencyConfigFileSchema, 2);

    expect(markers).toEqual([]);
  });
});

describe("parseVersion", () => {
  it("returns the version from valid yaml", () => {
    const text = "name: Test Agency\nstateCode: US_XX\nversion: 5\n";

    expect(parseVersion(text, AgencyConfigFileSchema)).toBe(5);
  });

  it("returns null for unparsable yaml", () => {
    const text = "name: [unterminated\n";

    expect(parseVersion(text, AgencyConfigFileSchema)).toBeNull();
  });

  it("returns null when the document fails schema validation", () => {
    const text = "stateCode: US_XX\nversion: 1\n";

    expect(parseVersion(text, AgencyConfigFileSchema)).toBeNull();
  });
});
