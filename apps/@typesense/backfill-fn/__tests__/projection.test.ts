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

import { assignNested, projectFields } from "../src/projection";

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

  it("merges constantFields onto the projected doc", () => {
    const result = projectFields(
      { stateCode: "US_TEST", staffExternalId: "OFFICER4" },
      ["stateCode", "staffExternalId"],
      "us_test_OFFICER4",
      { system: "SUPERVISION" },
    );
    expect(result).toEqual({
      id: "us_test_OFFICER4",
      stateCode: "US_TEST",
      staffExternalId: "OFFICER4",
      system: "SUPERVISION",
    });
  });

  it("constantFields win over source values for the same key", () => {
    // If a source doc happens to carry `system` from an earlier ETL revision,
    // the canonical constant from the backfill config still wins.
    const result = projectFields(
      { stateCode: "US_TEST", system: "STALE_VALUE" },
      ["stateCode", "system"],
      "doc-1",
      { system: "SUPERVISION" },
    );
    expect(result["system"]).toBe("SUPERVISION");
  });

  it("constantFields cannot clobber the id", () => {
    // Defence in depth: a constantFields.id entry must never override docId,
    // or two sources feeding the same target could collide.
    const result = projectFields({}, [], "real-id", { id: "sneak" });
    expect(result["id"]).toBe("real-id");
  });

  it("derivedFields maps a source value through a lookup and stamps the target", () => {
    // The locations `system` hook relies on this — idType is projected AND
    // used to derive `system` on the emitted doc.
    const result = projectFields(
      { idType: "districtId", stateCode: "US_TN" },
      ["idType", "stateCode"],
      "loc-1",
      undefined,
      [
        {
          from: "idType",
          into: "system",
          valueMapping: {
            districtId: "SUPERVISION",
            facilityId: "INCARCERATION",
          },
        },
      ],
    );
    expect(result).toEqual({
      id: "loc-1",
      idType: "districtId",
      stateCode: "US_TN",
      system: "SUPERVISION",
    });
  });

  it("derivedFields leaves the target unset when the source value has no mapping", () => {
    // Safer than defaulting: a new idType introduced upstream shouldn't get
    // silently classified as INCARCERATION just because that's the majority
    // side today. Missing `system` under-permits — the caseload query
    // returns nothing rather than the wrong thing.
    const result = projectFields(
      { idType: "unknownType" },
      ["idType"],
      "loc-1",
      undefined,
      [
        {
          from: "idType",
          into: "system",
          valueMapping: { districtId: "SUPERVISION" },
        },
      ],
    );
    expect(result).not.toHaveProperty("system");
  });

  it("derivedFields does nothing when the source field is missing", () => {
    const result = projectFields(
      { stateCode: "US_TN" },
      ["stateCode"],
      "loc-1",
      undefined,
      [
        {
          from: "idType",
          into: "system",
          valueMapping: { districtId: "SUPERVISION" },
        },
      ],
    );
    expect(result).not.toHaveProperty("system");
  });

  it("constantFields win over derivedFields on key collision", () => {
    // If both are set for the same target key, the explicit constant is
    // authoritative. Not expected in practice but the semantic should be
    // stable.
    const result = projectFields(
      { idType: "districtId" },
      ["idType"],
      "loc-1",
      { system: "CANONICAL" },
      [
        {
          from: "idType",
          into: "system",
          valueMapping: { districtId: "SUPERVISION" },
        },
      ],
    );
    expect(result["system"]).toBe("CANONICAL");
  });

  it("derivedFields copy variant stamps a source field into another when the guard matches", () => {
    // The locations `district` hook relies on this — district-idType docs
    // already carry the district name in `locationId`, and we surface it
    // under `district` for the byDistricts filter.
    const result = projectFields(
      { idType: "districtId", locationId: "DISTRICT 2" },
      ["idType", "locationId"],
      "loc-1",
      undefined,
      [
        {
          copyFrom: "locationId",
          into: "district",
          when: { field: "idType", equals: "districtId" },
        },
      ],
    );
    expect(result["district"]).toBe("DISTRICT 2");
  });

  it("derivedFields copy variant does nothing when the guard doesn't match", () => {
    // A facility-idType location shouldn't get `district` populated — the
    // system-side arm of the caseload filter matches it, not the district
    // arm.
    const result = projectFields(
      { idType: "facilityId", locationId: "FACILITY 1" },
      ["idType", "locationId"],
      "loc-1",
      undefined,
      [
        {
          copyFrom: "locationId",
          into: "district",
          when: { field: "idType", equals: "districtId" },
        },
      ],
    );
    expect(result).not.toHaveProperty("district");
  });

  it("derivedFields copy variant does nothing when the source field is missing", () => {
    const result = projectFields(
      { idType: "districtId" },
      ["idType"],
      "loc-1",
      undefined,
      [
        {
          copyFrom: "locationId",
          into: "district",
          when: { field: "idType", equals: "districtId" },
        },
      ],
    );
    expect(result).not.toHaveProperty("district");
  });

  it("derivedFields supports both variants in the same array", () => {
    // Real-world locations config: value-map for system + conditional copy
    // for district. Both apply on the same doc.
    const result = projectFields(
      { idType: "districtId", locationId: "DISTRICT 2" },
      ["idType", "locationId"],
      "loc-1",
      undefined,
      [
        {
          from: "idType",
          into: "system",
          valueMapping: {
            districtId: "SUPERVISION",
            facilityId: "INCARCERATION",
          },
        },
        {
          copyFrom: "locationId",
          into: "district",
          when: { field: "idType", equals: "districtId" },
        },
      ],
    );
    expect(result).toMatchObject({
      idType: "districtId",
      locationId: "DISTRICT 2",
      system: "SUPERVISION",
      district: "DISTRICT 2",
    });
  });
});
