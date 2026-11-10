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

import type { GeminiSchema } from "~@idaho-th/trpc/routes/vertex/vertex.types";

import {
  FIELD_CONFIDENCE_MAX,
  FIELD_CONFIDENCE_MIN,
  resolveResponseSchema,
  stripFieldConfidence,
  withFieldConfidence,
} from "../vertex.schema.confidence";

const leafSchema: GeminiSchema = {
  type: "object",
  properties: {
    fullName: { type: "string" },
    age: { type: "integer" },
  },
  required: ["fullName"],
};

const nestedSchema: GeminiSchema = {
  type: "object",
  properties: {
    clientIdentity: leafSchema,
    notes: { type: "string" },
  },
  required: ["clientIdentity", "notes"],
};

describe("withFieldConfidence", () => {
  it("returns non-object schemas unchanged", () => {
    const schema: GeminiSchema = { type: "string" };
    expect(withFieldConfidence(schema)).toBe(schema);
  });

  it("pairs each leaf field with a Confidence integer and mirrors required", () => {
    const result = withFieldConfidence(leafSchema);

    expect(result.properties?.["fullName"]).toEqual({ type: "string" });
    expect(result.properties?.["fullNameConfidence"]).toEqual({
      type: "integer",
      minimum: FIELD_CONFIDENCE_MIN,
      maximum: FIELD_CONFIDENCE_MAX,
    });
    expect(result.properties?.["ageConfidence"]).toEqual({
      type: "integer",
      minimum: FIELD_CONFIDENCE_MIN,
      maximum: FIELD_CONFIDENCE_MAX,
    });
    expect(result.required).toEqual(["fullName", "fullNameConfidence"]);
  });

  it("recurses into nested object schemas without adding Confidence on the nest key", () => {
    const result = withFieldConfidence(nestedSchema);

    expect(result.properties?.["clientIdentityConfidence"]).toBeUndefined();
    expect(result.properties?.["notesConfidence"]).toEqual({
      type: "integer",
      minimum: FIELD_CONFIDENCE_MIN,
      maximum: FIELD_CONFIDENCE_MAX,
    });
    expect(
      (result.properties?.["clientIdentity"] as GeminiSchema).properties?.[
        "fullNameConfidence"
      ],
    ).toBeDefined();
    expect(result.required).toEqual([
      "clientIdentity",
      "notes",
      "notesConfidence",
    ]);
  });
});

describe("resolveResponseSchema", () => {
  it("returns the original schema when confidence is disabled", () => {
    expect(resolveResponseSchema(leafSchema, false)).toBe(leafSchema);
  });

  it("injects confidence when enabled", () => {
    const result = resolveResponseSchema(leafSchema, true);
    expect(result.properties?.["fullNameConfidence"]).toBeDefined();
  });
});

describe("stripFieldConfidence", () => {
  it("deep-strips *Confidence keys from objects and arrays", () => {
    const input = {
      fullName: "Jane Doe",
      fullNameConfidence: 99,
      nested: {
        age: 40,
        ageConfidence: 80,
      },
      items: [{ label: "a", labelConfidence: 50 }, "keep"],
    };

    expect(stripFieldConfidence(input)).toEqual({
      fullName: "Jane Doe",
      nested: { age: 40 },
      items: [{ label: "a" }, "keep"],
    });
  });

  it("returns primitives unchanged", () => {
    expect(stripFieldConfidence("hello")).toBe("hello");
    expect(stripFieldConfidence(12)).toBe(12);
    expect(stripFieldConfidence(null)).toBeNull();
  });
});
