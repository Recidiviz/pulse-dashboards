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
  assignNested,
  parseImportResponse,
  projectFields,
} from "../src/backfill";

describe("assignNested", () => {
  it("copies a top-level value when the leaf exists", () => {
    const out = {};
    assignNested(out, { foo: "bar" }, "foo");
    expect(out).toEqual({ foo: "bar" });
  });

  it("walks a dotted path and reconstructs nested output", () => {
    const out = {};
    assignNested(
      out,
      { personName: { givenNames: "Alex", surname: "Doe" } },
      "personName.givenNames",
    );
    expect(out).toEqual({ personName: { givenNames: "Alex" } });
  });

  it("merges multiple sibling leaves into the same parent", () => {
    const out = {};
    assignNested(
      out,
      { personName: { givenNames: "Alex", surname: "Doe" } },
      "personName.givenNames",
    );
    assignNested(
      out,
      { personName: { givenNames: "Alex", surname: "Doe" } },
      "personName.surname",
    );
    expect(out).toEqual({ personName: { givenNames: "Alex", surname: "Doe" } });
  });

  it("preserves a legitimate null leaf value", () => {
    const out = {};
    assignNested(out, { personName: { surname: null } }, "personName.surname");
    expect(out).toEqual({ personName: { surname: null } });
  });

  it("skips silently when an intermediate key is missing", () => {
    const out = {};
    assignNested(out, { personName: {} }, "personName.givenNames");
    expect(out).toEqual({});
  });

  it("skips silently when an intermediate value is not an object", () => {
    const out = {};
    assignNested(out, { personName: "not-an-object" }, "personName.givenNames");
    expect(out).toEqual({});
  });

  it("walks three or more levels of nesting", () => {
    const out = {};
    assignNested(
      out,
      { metadata: { crc: { facilities: ["A", "B"] } } },
      "metadata.crc.facilities",
    );
    expect(out).toEqual({ metadata: { crc: { facilities: ["A", "B"] } } });
  });
});

describe("projectFields", () => {
  it("stamps in the docId and copies declared top-level fields", () => {
    const result = projectFields(
      { stateCode: "US_TEST", extraneous: "drop me" },
      ["stateCode"],
      "doc-1",
    );
    expect(result).toEqual({ id: "doc-1", stateCode: "US_TEST" });
  });

  it("drops top-level fields that are not declared", () => {
    const result = projectFields(
      { stateCode: "US_TEST", piiBlob: "secret" },
      ["stateCode"],
      "doc-1",
    );
    expect(result).not.toHaveProperty("piiBlob");
  });

  it("walks dotted paths into nested source objects", () => {
    const result = projectFields(
      {
        stateCode: "US_TEST",
        personName: { givenNames: "Alex", surname: "Doe" },
      },
      ["stateCode", "personName.givenNames", "personName.surname"],
      "doc-2",
    );
    expect(result).toEqual({
      id: "doc-2",
      stateCode: "US_TEST",
      personName: { givenNames: "Alex", surname: "Doe" },
    });
  });

  it("does not ship parent object fields that contain undeclared children", () => {
    // Source has metadata.crcFacilities AND metadata.crcWorkRelease, but only
    // metadata.crcFacilities is declared — output must drop crcWorkRelease.
    const result = projectFields(
      {
        metadata: {
          crcFacilities: ["A"],
          crcWorkRelease: ["B"],
        },
      },
      ["metadata.crcFacilities"],
      "doc-3",
    );
    expect(result).toEqual({
      id: "doc-3",
      metadata: { crcFacilities: ["A"] },
    });
  });

  it("silently skips missing top-level fields", () => {
    const result = projectFields({}, ["stateCode"], "doc-4");
    expect(result).toEqual({ id: "doc-4" });
  });

  it("uses the docId argument, not any incoming `id` on the source", () => {
    // Person collections rely on this — the source's `id` is `OFFICER4` but
    // the Typesense id is the composite Firestore doc id, e.g. `us_id_OFFICER4`.
    const result = projectFields(
      { id: "OFFICER4", stateCode: "US_TEST" },
      ["stateCode"],
      "us_id_OFFICER4",
    );
    expect(result["id"]).toBe("us_id_OFFICER4");
  });
});

describe("parseImportResponse", () => {
  it("returns a pre-parsed array as-is (modern client)", () => {
    const raw = [{ success: true }, { success: false, error: "boom" }];
    expect(parseImportResponse(raw)).toEqual(raw);
  });

  it("parses NDJSON string into per-doc entries (older client)", () => {
    const raw = '{"success":true}\n{"success":false,"error":"boom"}';
    expect(parseImportResponse(raw)).toEqual([
      { success: true },
      { success: false, error: "boom" },
    ]);
  });

  it("skips blank lines in NDJSON output", () => {
    const raw = '{"success":true}\n\n{"success":true}\n';
    expect(parseImportResponse(raw)).toEqual([
      { success: true },
      { success: true },
    ]);
  });

  it("synthesizes a failure entry for unparseable response lines", () => {
    const raw = '{"success":true}\nnot json\n';
    const result = parseImportResponse(raw);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ success: true });
    expect(result[1]).toEqual({
      success: false,
      error: "unparseable response line: not json",
    });
  });

  it("returns an empty array for an empty string", () => {
    expect(parseImportResponse("")).toEqual([]);
  });
});
