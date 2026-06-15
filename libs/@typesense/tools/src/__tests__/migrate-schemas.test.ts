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

import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";

import {
  checkOptionalOnAdds,
  diffSchema,
  isAutoNestedChild,
} from "../migrate-schemas";

describe("isAutoNestedChild", () => {
  it("returns false for top-level field names", () => {
    expect(isAutoNestedChild("stateCode", new Set(["personName"]))).toBe(false);
  });

  it("returns true when the parent name is a locally-declared object field", () => {
    expect(
      isAutoNestedChild("personName.givenNames", new Set(["personName"])),
    ).toBe(true);
  });

  it("returns false when the parent is NOT a locally-declared object field", () => {
    expect(isAutoNestedChild("personName.givenNames", new Set())).toBe(false);
  });

  it("matches the FIRST-dot prefix, so deeply nested children are caught", () => {
    expect(
      isAutoNestedChild("address.street.line1", new Set(["address"])),
    ).toBe(true);
  });

  it("does not match an unrelated parent that's a substring of the field", () => {
    // "personNames" (plural) is not a parent of "personName.x"
    expect(
      isAutoNestedChild("personName.givenNames", new Set(["personNames"])),
    ).toBe(false);
  });
});

describe("diffSchema", () => {
  function local(
    fields: NonNullable<CollectionCreateSchema["fields"]>,
    extras: Partial<CollectionCreateSchema> = {},
  ): CollectionCreateSchema {
    return { name: "c", enable_nested_fields: true, fields, ...extras };
  }

  it("treats everything as an add when live has no fields", () => {
    const result = diffSchema(
      local([
        { name: "a", type: "string" },
        { name: "b", type: "string" },
      ]),
      { fields: [] },
    );
    expect(result.toAdd.map((f) => f.name)).toEqual(["a", "b"]);
    expect(result.toDrop).toEqual([]);
    expect(result.fieldConflicts).toEqual([]);
  });

  it("is a no-op when local and live agree on all declared attrs", () => {
    const result = diffSchema(
      local([{ name: "a", type: "string", facet: true }]),
      { fields: [{ name: "a", type: "string", facet: true }] },
    );
    expect(result.toAdd).toEqual([]);
    expect(result.toDrop).toEqual([]);
    expect(result.fieldConflicts).toEqual([]);
  });

  it("queues unknown live fields for drop", () => {
    const result = diffSchema(local([{ name: "a", type: "string" }]), {
      fields: [
        { name: "a", type: "string" },
        { name: "stale", type: "string" },
      ],
    });
    expect(result.toDrop).toEqual(["stale"]);
    expect(result.toAdd).toEqual([]);
  });

  it("skips auto-nested children when the parent is a locally-declared object", () => {
    // Simulates the personName-as-object case: local declares `personName`
    // as an object; live returns auto-expanded children. Those should NOT
    // be queued for drop.
    const result = diffSchema(local([{ name: "personName", type: "object" }]), {
      fields: [
        { name: "personName", type: "object" },
        { name: "personName.givenNames", type: "string" },
        { name: "personName.surname", type: "string" },
        { name: "personName.middleNames", type: "string" },
      ],
    });
    expect(result.toDrop).toEqual([]);
    expect(result.toAdd).toEqual([]);
  });

  it("queues drop for orphan children once their parent is no longer declared as object", () => {
    // After narrowing — local declares specific children but NOT the parent
    // object. Live still has the parent + extra auto-children. All extras get
    // dropped because the parent isn't in the object-field set anymore.
    const result = diffSchema(
      local([
        { name: "personName.givenNames", type: "string" },
        { name: "personName.surname", type: "string" },
      ]),
      {
        fields: [
          { name: "personName", type: "object" },
          { name: "personName.givenNames", type: "string" },
          { name: "personName.surname", type: "string" },
          { name: "personName.middleNames", type: "string" },
        ],
      },
    );
    expect(result.toDrop.sort()).toEqual(
      ["personName", "personName.middleNames"].sort(),
    );
    expect(result.toAdd).toEqual([]);
  });

  it("flags type changes as field conflicts", () => {
    const result = diffSchema(local([{ name: "a", type: "string" }]), {
      fields: [{ name: "a", type: "int32" }],
    });
    expect(result.fieldConflicts).toHaveLength(1);
    expect(result.fieldConflicts[0].field).toBe("a");
    expect(result.fieldConflicts[0].reason).toContain("type");
  });

  it("flags optional flips as field conflicts", () => {
    // optional: true (local) vs optional: false (live)
    const result = diffSchema(
      local([{ name: "a", type: "string", optional: true }]),
      { fields: [{ name: "a", type: "string", optional: false }] },
    );
    expect(result.fieldConflicts).toHaveLength(1);
    expect(result.fieldConflicts[0].field).toBe("a");
    expect(result.fieldConflicts[0].reason).toContain("optional");
  });

  it("flags facet changes as field conflicts", () => {
    const result = diffSchema(
      local([{ name: "a", type: "string", facet: true }]),
      { fields: [{ name: "a", type: "string", facet: false }] },
    );
    expect(result.fieldConflicts).toHaveLength(1);
    expect(result.fieldConflicts[0].reason).toContain("facet");
  });

  it("does NOT flag attrs that the local schema doesn't declare", () => {
    // Local omits `facet`; live returns Typesense's default (`false`).
    // We should not enforce attrs we don't care about, so no conflict.
    const result = diffSchema(local([{ name: "a", type: "string" }]), {
      fields: [{ name: "a", type: "string", facet: false }],
    });
    expect(result.fieldConflicts).toEqual([]);
  });

  it("flags enable_nested_fields changes as collection-level conflicts", () => {
    const result = diffSchema(
      local([{ name: "a", type: "string" }], { enable_nested_fields: true }),
      { fields: [{ name: "a", type: "string" }], enable_nested_fields: false },
    );
    expect(result.collectionConflicts).toHaveLength(1);
    expect(result.collectionConflicts[0]).toContain("enable_nested_fields");
  });

  it("flags default_sorting_field changes as collection-level conflicts", () => {
    const result = diffSchema(
      local([{ name: "a", type: "string" }], {
        default_sorting_field: "a",
      }),
      {
        fields: [{ name: "a", type: "string" }],
        default_sorting_field: "different",
      },
    );
    expect(result.collectionConflicts).toHaveLength(1);
    expect(result.collectionConflicts[0]).toContain("default_sorting_field");
  });

  it("handles a realistic adds + drops + skip-auto-nested mix", () => {
    const result = diffSchema(
      local([
        { name: "stateCode", type: "string", facet: true },
        { name: "personName.givenNames", type: "string", optional: true },
        { name: "newField", type: "string", optional: true },
      ]),
      {
        fields: [
          { name: "stateCode", type: "string", facet: true },
          // Live side also reports optional: true on the leaf — the local
          // schema declares it that way and the migration would have applied
          // it. We assert no conflict to verify the diff correctly ignores
          // matching attrs.
          { name: "personName.givenNames", type: "string", optional: true },
          { name: "personName.middleNames", type: "string" }, // orphan — should drop
          { name: "obsolete", type: "string" }, // not declared — should drop
        ],
      },
    );
    expect(result.toAdd.map((f) => f.name)).toEqual(["newField"]);
    expect(result.toDrop.sort()).toEqual(
      ["personName.middleNames", "obsolete"].sort(),
    );
    expect(result.fieldConflicts).toEqual([]);
  });
});

describe("checkOptionalOnAdds", () => {
  function diffWith(
    toAdd: NonNullable<CollectionCreateSchema["fields"]>,
  ): Parameters<typeof checkOptionalOnAdds>[0] {
    return {
      collection: "c",
      toAdd,
      toDrop: [],
      fieldConflicts: [],
      collectionConflicts: [],
    };
  }

  it("returns no errors when there are no adds", () => {
    expect(checkOptionalOnAdds(diffWith([]))).toEqual([]);
  });

  it("returns no errors when every add is optional", () => {
    expect(
      checkOptionalOnAdds(
        diffWith([
          { name: "a", type: "string", optional: true },
          { name: "b", type: "int32", optional: true },
        ]),
      ),
    ).toEqual([]);
  });

  it("flags an add without an explicit `optional` flag", () => {
    const errors = checkOptionalOnAdds(
      diffWith([{ name: "a", type: "string" }]),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("c.a");
    expect(errors[0]).toContain("optional: true");
  });

  it("flags an explicit optional: false add", () => {
    const errors = checkOptionalOnAdds(
      diffWith([{ name: "a", type: "string", optional: false }]),
    );
    expect(errors).toHaveLength(1);
  });

  it("flags each non-optional add separately", () => {
    const errors = checkOptionalOnAdds(
      diffWith([
        { name: "a", type: "string" },
        { name: "b", type: "string", optional: true },
        { name: "c", type: "string" },
      ]),
    );
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("c.a");
    expect(errors[1]).toContain("c.c");
  });
});
