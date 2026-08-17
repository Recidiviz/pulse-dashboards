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
  buildPruneFilter,
  createRateLimiter,
  instantiateFromSourceCollection,
  isValidStateCode,
  mapWithConcurrency,
  parseImportResponse,
  projectFields,
  resolveBatchSize,
  resolveConcurrency,
  resolveImportRatePerSec,
  resolvePruneStale,
  runBackfill,
  selectStaleIds,
} from "../src/backfill";

// ---------------------------------------------------------------------------
// Integration harness for runBackfill: fake Firestore + Typesense clients wired
// in via module mocks, so the real backfill + prune flow (paging, projection,
// import, export-diff, delete) can be driven without a live cluster or emulator.
// ---------------------------------------------------------------------------

interface FakeDoc {
  id: string;
  data: Record<string, unknown>;
}

type FakeSnapshot = {
  empty: boolean;
  size: number;
  docs: Array<{ id: string; data: () => Record<string, unknown> }>;
};

type FakeQuery = {
  where: (field: string, op: string, value: unknown) => FakeQuery;
  orderBy: (field?: unknown) => FakeQuery;
  limit: (n: number) => FakeQuery;
  startAfter: (cursor: { id: string }) => FakeQuery;
  get: () => Promise<FakeSnapshot>;
};

type FakeFirestore = { collection: (name: string) => FakeQuery };

type FakeTypesenseClient = {
  collections: (name: string) => {
    documents: (id?: string) => {
      import: (docs: unknown[], opts?: unknown) => Promise<unknown>;
      export: (options?: {
        include_fields?: string;
        filter_by?: string;
      }) => Promise<string>;
      delete: () => Promise<unknown>;
    };
  };
};

// Holders the module mocks read from, so each test installs its own fakes.
const { firestoreHolder, typesenseHolder } = vi.hoisted(() => ({
  firestoreHolder: { current: undefined as FakeFirestore | undefined },
  typesenseHolder: { current: undefined as FakeTypesenseClient | undefined },
}));

vi.mock("firebase-admin", () => {
  const firestore = (() => firestoreHolder.current) as unknown as {
    (): FakeFirestore | undefined;
    FieldPath: { documentId: () => string };
  };
  // backfillCollection orders by documentId(); the fake query ignores the arg.
  firestore.FieldPath = { documentId: () => "__name__" };
  return { firestore };
});

vi.mock("~@typesense/client", () => ({
  createTypesenseClient: () => typesenseHolder.current,
}));

// Serves a fixed set of docs per collection, honoring the stateCode equality
// filter and the id-ordered pagination (orderBy(documentId) + startAfter) that
// backfillCollection relies on.
function makeFirestore(collections: Record<string, FakeDoc[]>): FakeFirestore {
  function query(
    name: string,
    opts: { state?: string; afterId?: string; limit?: number },
  ): FakeQuery {
    return {
      where: (field, _op, value) =>
        query(name, {
          ...opts,
          state: field === "stateCode" ? String(value) : opts.state,
        }),
      orderBy: () => query(name, opts),
      limit: (n) => query(name, { ...opts, limit: n }),
      startAfter: (cursor) => query(name, { ...opts, afterId: cursor.id }),
      get: async () => {
        let docs = [...(collections[name] ?? [])];
        if (opts.state !== undefined) {
          docs = docs.filter((d) => d.data["stateCode"] === opts.state);
        }
        docs.sort((a, b) => a.id.localeCompare(b.id));
        if (opts.afterId !== undefined) {
          const idx = docs.findIndex((d) => d.id === opts.afterId);
          if (idx >= 0) docs = docs.slice(idx + 1);
        }
        const page =
          opts.limit !== undefined ? docs.slice(0, opts.limit) : docs;
        return {
          empty: page.length === 0,
          size: page.length,
          docs: page.map((d) => ({ id: d.id, data: () => d.data })),
        };
      },
    };
  }
  return { collection: (name) => query(name, {}) };
}

// `id` is required; any other keys are
// arbitrary so callers can pin constantFields discriminators (stateCode,
// opportunityType, …) that the filter_by parser matches on.
type TypesenseDoc = Record<string, unknown> & { id: string };

// Records imports/exports/deletes for assertions. export() honors filter_by
// as either a single `key:=value` clause or several joined by ` && `, matching
// how buildPruneFilter emits them — so the fake mirrors the cluster's scoping.
function makeTypesense(existing: Record<string, TypesenseDoc[]>) {
  const importedDocs: Record<string, Array<Record<string, unknown>>> = {};
  const deletedIds: Record<string, string[]> = {};
  const exportOptions: Array<{ name: string; filter_by?: string }> = [];

  const client: FakeTypesenseClient = {
    collections: (name) => ({
      documents: (id?: string) => ({
        import: async (docs) => {
          (importedDocs[name] ??= []).push(
            ...(docs as Array<Record<string, unknown>>),
          );
          return docs.map(() => ({ success: true }));
        },
        export: async (options) => {
          exportOptions.push({ name, filter_by: options?.filter_by });
          let docs = existing[name] ?? [];
          if (options?.filter_by) {
            const clauses = options.filter_by
              .split(/\s*&&\s*/)
              .map((c) => c.match(/^(\w+):=(.+)$/))
              .filter((m): m is RegExpMatchArray => m !== null);
            for (const [, key, value] of clauses) {
              docs = docs.filter((d) => d[key] === value);
            }
          }
          return docs.map((d) => JSON.stringify({ id: d.id })).join("\n");
        },
        delete: async () => {
          (deletedIds[name] ??= []).push(id as string);
          return {};
        },
      }),
    }),
  };

  return { client, importedDocs, deletedIds, exportOptions };
}

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

describe("resolveConcurrency", () => {
  const original = process.env["BACKFILL_CONCURRENCY"];

  afterEach(() => {
    if (original === undefined) delete process.env["BACKFILL_CONCURRENCY"];
    else process.env["BACKFILL_CONCURRENCY"] = original;
  });

  it("reads a positive integer from the env var", () => {
    process.env["BACKFILL_CONCURRENCY"] = "5";
    expect(resolveConcurrency()).toBe(5);
  });

  it("falls back to the default when the env var is unset", () => {
    delete process.env["BACKFILL_CONCURRENCY"];
    expect(resolveConcurrency()).toBe(3);
  });

  it.each(["0", "-2", "abc", "2.5", ""])(
    "falls back to the default for invalid value %j",
    (value) => {
      process.env["BACKFILL_CONCURRENCY"] = value;
      expect(resolveConcurrency()).toBe(3);
    },
  );
});

describe("resolveImportRatePerSec", () => {
  const original = process.env["BACKFILL_IMPORT_RATE_PER_SEC"];

  afterEach(() => {
    if (original === undefined)
      delete process.env["BACKFILL_IMPORT_RATE_PER_SEC"];
    else process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = original;
  });

  it("reads a positive number from the env var", () => {
    process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = "5";
    expect(resolveImportRatePerSec()).toBe(5);
  });

  it("accepts a fractional rate (unlike concurrency, this need not be integer)", () => {
    process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = "2.5";
    expect(resolveImportRatePerSec()).toBe(2.5);
  });

  it("treats an explicit 0 as disabled (not a fallback to the default)", () => {
    process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = "0";
    expect(resolveImportRatePerSec()).toBe(0);
  });

  it("falls back to the default when unset", () => {
    delete process.env["BACKFILL_IMPORT_RATE_PER_SEC"];
    expect(resolveImportRatePerSec()).toBe(50);
  });

  it.each(["-2", "abc", "", "  "])(
    "falls back to the default for invalid value %j",
    (value) => {
      process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = value;
      expect(resolveImportRatePerSec()).toBe(50);
    },
  );
});

describe("resolveBatchSize", () => {
  const original = process.env["BACKFILL_BATCH_SIZE"];

  afterEach(() => {
    if (original === undefined) delete process.env["BACKFILL_BATCH_SIZE"];
    else process.env["BACKFILL_BATCH_SIZE"] = original;
  });

  it("reads a positive integer from the env var", () => {
    process.env["BACKFILL_BATCH_SIZE"] = "1000";
    expect(resolveBatchSize()).toBe(1000);
  });

  it("falls back to the default when unset", () => {
    delete process.env["BACKFILL_BATCH_SIZE"];
    expect(resolveBatchSize()).toBe(500);
  });

  it.each(["0", "-2", "abc", "2.5", ""])(
    "falls back to the default for invalid value %j",
    (value) => {
      process.env["BACKFILL_BATCH_SIZE"] = value;
      expect(resolveBatchSize()).toBe(500);
    },
  );
});

describe("resolvePruneStale", () => {
  const original = process.env["BACKFILL_PRUNE_STALE"];

  afterEach(() => {
    if (original === undefined) delete process.env["BACKFILL_PRUNE_STALE"];
    else process.env["BACKFILL_PRUNE_STALE"] = original;
  });

  it("defaults to enabled when unset", () => {
    delete process.env["BACKFILL_PRUNE_STALE"];
    expect(resolvePruneStale()).toBe(true);
  });

  it.each(["false", "FALSE", "  False  "])(
    "is disabled only for the literal false %j (case- and space-insensitive)",
    (value) => {
      process.env["BACKFILL_PRUNE_STALE"] = value;
      expect(resolvePruneStale()).toBe(false);
    },
  );

  it.each(["true", "1", "yes", "", "  ", "anything"])(
    "stays enabled for any non-false value %j",
    (value) => {
      process.env["BACKFILL_PRUNE_STALE"] = value;
      expect(resolvePruneStale()).toBe(true);
    },
  );
});

describe("isValidStateCode", () => {
  it.each([
    "US_ID",
    "US_ND",
    "US_TX",
    "US_CA",
    "US_ZZ", // well-formed but not (yet) in ~auth-utils — the ETL fires for
    "US_XX", // states before they're enrolled, so shape is the gate, not membership
  ])("accepts a well-formed state code %j", (value) => {
    expect(isValidStateCode(value)).toBe(true);
  });

  it.each([
    "us_id", // wrong case — codes are uppercase
    "US_TEX", // too many letters
    "US_I", // too few letters
    "US_1D", // digits not allowed
    "USTX",
    "US_ID || true", // filter-injection attempt
    "US ID",
    "",
  ])("rejects a malformed code %j", (value) => {
    expect(isValidStateCode(value)).toBe(false);
  });

  it("rejects non-string values", () => {
    for (const value of [123, null, undefined, {}, ["US_ID"]]) {
      expect(isValidStateCode(value)).toBe(false);
    }
  });
});

describe("buildPruneFilter", () => {
  it("returns undefined with no scope arguments (whole-collection prune)", () => {
    expect(buildPruneFilter(undefined, undefined)).toBeUndefined();
  });

  it("uses the invocation stateCode when only that is set", () => {
    expect(buildPruneFilter(undefined, "US_ID")).toBe("stateCode:=US_ID");
  });

  it("joins constantFields into an AND expression", () => {
    // Multi-source targets need this — a `US_TN_compliantReporting` source
    // must only prune docs in `opportunities` where BOTH stateCode AND
    // opportunityType match, otherwise it would delete every other opp type.
    expect(
      buildPruneFilter(
        { stateCode: "US_TN", opportunityType: "compliantReporting" },
        undefined,
      ),
    ).toBe("stateCode:=US_TN && opportunityType:=compliantReporting");
  });

  it("invocation stateCode overrides constantFields.stateCode when both are set", () => {
    // runBackfill filters mismatched sources out before we get here, so the
    // values should never disagree in practice — but be defensive because
    // prune deletes: the more explicit invocation-level arg wins.
    expect(
      buildPruneFilter(
        { stateCode: "US_TN", opportunityType: "compliantReporting" },
        "US_ID",
      ),
    ).toBe("stateCode:=US_ID && opportunityType:=compliantReporting");
  });
});

describe("instantiateFromSourceCollection", () => {
  it("returns the input unchanged when no sourceCollection is supplied", () => {
    const configs = [
      { name: "clients", fields: ["stateCode"] },
      { name: "opportunities", fields: ["externalId"] },
    ];
    expect(instantiateFromSourceCollection(configs, undefined)).toEqual(
      configs,
    );
  });

  it("fills in sourceCollection, docIdPrefix, and constantFields.sourceCollection on template configs", () => {
    // The opportunity ETL trigger relies on this — a bare template config
    // gets instantiated per-source at trigger time.
    const result = instantiateFromSourceCollection(
      [{ name: "opportunities", fields: ["externalId", "opportunityType"] }],
      "US_TN-compliantReportingReferrals",
    );
    expect(result).toEqual([
      {
        name: "opportunities",
        fields: ["externalId", "opportunityType"],
        sourceCollection: "US_TN-compliantReportingReferrals",
        docIdPrefix: "US_TN-compliantReportingReferrals",
        constantFields: {
          sourceCollection: "US_TN-compliantReportingReferrals",
        },
      },
    ]);
  });

  it("does NOT overwrite a config that already carries its own sourceCollection", () => {
    // Statically-enumerated multi-source targets (if any) shouldn't be
    // clobbered by an invocation-level sourceCollection meant for a
    // different template.
    const configs = [
      {
        name: "opportunities",
        sourceCollection: "US_ID-LSUReferrals",
        fields: ["externalId"],
        docIdPrefix: "US_ID-LSUReferrals",
        constantFields: { sourceCollection: "US_ID-LSUReferrals" },
      },
    ];
    expect(
      instantiateFromSourceCollection(configs, "some-other-source"),
    ).toEqual(configs);
  });

  it("preserves an explicit docIdPrefix over the source-derived default", () => {
    // Defensive: if a caller ever supplies a template with a custom prefix,
    // instantiation should keep it instead of overwriting with the source name.
    const [result] = instantiateFromSourceCollection(
      [
        {
          name: "opportunities",
          fields: ["externalId"],
          docIdPrefix: "custom-prefix",
        },
      ],
      "US_TN-somethingReferrals",
    );
    expect(result?.docIdPrefix).toBe("custom-prefix");
  });

  it("merges into (not replaces) existing constantFields", () => {
    const [result] = instantiateFromSourceCollection(
      [
        {
          name: "opportunities",
          fields: ["externalId"],
          constantFields: { pipelineVersion: "v2" },
        },
      ],
      "US_TN-somethingReferrals",
    );
    expect(result?.constantFields).toEqual({
      pipelineVersion: "v2",
      sourceCollection: "US_TN-somethingReferrals",
    });
  });

  it("applies the invocation sourceCollection to ANY config that lacks its own", () => {
    // Instantiation is name-blind: any config lacking a static sourceCollection
    // gets the invocation's value, not just the opportunities template.
    const [result] = instantiateFromSourceCollection(
      [{ name: "clients", fields: ["stateCode"] }],
      "US_TN-somethingReferrals",
    );
    expect(result).toMatchObject({
      name: "clients",
      sourceCollection: "US_TN-somethingReferrals",
    });
  });
});

describe("selectStaleIds", () => {
  it("returns exported ids that are absent from the keep set", () => {
    const exported = '{"id":"a"}\n{"id":"b"}\n{"id":"c"}';
    expect(selectStaleIds(exported, new Set(["a", "c"]))).toEqual(["b"]);
  });

  it("returns nothing when every exported id is in the keep set", () => {
    const exported = '{"id":"a"}\n{"id":"b"}';
    expect(selectStaleIds(exported, new Set(["a", "b"]))).toEqual([]);
  });

  it("treats an empty export as nothing to prune", () => {
    expect(selectStaleIds("", new Set(["a"]))).toEqual([]);
  });

  it("skips blank, unparseable, and id-less lines", () => {
    const exported = '{"id":"a"}\n\nnot json\n{"foo":"bar"}\n{"id":"b"}';
    expect(selectStaleIds(exported, new Set())).toEqual(["a", "b"]);
  });

  it("skips non-string ids", () => {
    const exported = '{"id":123}\n{"id":"b"}';
    expect(selectStaleIds(exported, new Set())).toEqual(["b"]);
  });
});

describe("createRateLimiter", () => {
  // Records every sleep request so we can assert how long each `take()` waited.
  // `now` is held constant so the assertions reflect the limiter's internal slot
  // reservation (nextAllowedAt) rather than a moving wall clock.
  function fakeClock(at = 0) {
    const sleeps: number[] = [];
    const now = (): number => at;
    const sleep = async (ms: number): Promise<void> => {
      sleeps.push(ms);
    };
    return { sleeps, now, sleep };
  }

  it("does not delay the very first permit", async () => {
    const { sleeps, now, sleep } = fakeClock();
    const limiter = createRateLimiter(10, now, sleep);
    await limiter.take();
    expect(sleeps).toEqual([]);
  });

  it("spaces sequential permits by 1000/ratePerSec ms", async () => {
    // 10/s => 100ms minimum interval.
    const { sleeps, now, sleep } = fakeClock();
    const limiter = createRateLimiter(10, now, sleep);
    await limiter.take();
    await limiter.take();
    await limiter.take();
    // First is free; each subsequent slot is pushed out another 100ms from a
    // fixed `now`, so the waits grow 100, 200.
    expect(sleeps).toEqual([100, 200]);
  });

  it("serializes concurrent callers FIFO, each spaced by the interval", async () => {
    const { sleeps, now, sleep } = fakeClock();
    const limiter = createRateLimiter(8, now, sleep); // 125ms interval
    await Promise.all([limiter.take(), limiter.take(), limiter.take()]);
    expect(sleeps).toEqual([125, 250]);
  });

  it("honors the configured rate (lower rate => longer gaps)", async () => {
    const { sleeps, now, sleep } = fakeClock();
    const limiter = createRateLimiter(2, now, sleep); // 500ms interval
    await limiter.take();
    await limiter.take();
    expect(sleeps).toEqual([500]);
  });

  it("does not wait when the reserved slot is already in the past", async () => {
    // Advance `now` past the reserved slot between calls: no backlog accrues.
    let clock = 0;
    const sleeps: number[] = [];
    const limiter = createRateLimiter(
      10,
      () => clock,
      async (ms) => {
        sleeps.push(ms);
      },
    );
    await limiter.take(); // reserves slot at 0, next allowed = 100
    clock = 1000; // a full second later — well past the reserved slot
    await limiter.take();
    expect(sleeps).toEqual([]); // neither call needed to wait
  });

  it.each([0, -1, Infinity, NaN])(
    "is disabled (never sleeps) for a non-positive/non-finite rate %p",
    async (rate) => {
      const { sleeps, now, sleep } = fakeClock();
      const limiter = createRateLimiter(rate, now, sleep);
      // Many back-to-back permits, none of which should ever wait.
      await limiter.take();
      await limiter.take();
      await limiter.take();
      expect(sleeps).toEqual([]);
    },
  );
});

describe("mapWithConcurrency", () => {
  // A deferred promise plus a manual resolve handle — lets a test hold tasks
  // open to observe how many run at once, then release them deliberately.
  function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  it("returns results in INPUT order regardless of completion order", async () => {
    // Later items resolve first; output must still match input order.
    const results = await mapWithConcurrency(
      [10, 20, 30],
      3,
      (item, index) =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve(`${index}:${item}`), (3 - index) * 5);
        }),
    );
    expect(results).toEqual(["0:10", "1:20", "2:30"]);
  });

  it("passes the item and its index to the task", async () => {
    const seen: Array<[string, number]> = [];
    await mapWithConcurrency(["a", "b", "c"], 2, async (item, index) => {
      seen.push([item, index]);
    });
    expect(seen).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 2],
    ]);
  });

  it("never runs more than `concurrency` tasks at once", async () => {
    const gates = Array.from({ length: 6 }, () => deferred<void>());
    let active = 0;
    let peak = 0;

    const run = mapWithConcurrency(gates, 2, async (gate) => {
      active += 1;
      peak = Math.max(peak, active);
      await gate.promise;
      active -= 1;
    });

    // Release gates one at a time, letting the pool refill between each. At no
    // point should more than 2 tasks be active. The serial await is the point
    // here — we step the pool one resolution at a time.
    for (const gate of gates) {
      // eslint-disable-next-line no-await-in-loop -- intentional serial stepping
      await Promise.resolve(); // flush microtasks so a worker can pick up work
      expect(active).toBeLessThanOrEqual(2);
      gate.resolve();
    }

    await run;
    expect(peak).toBe(2);
  });

  it("clamps concurrency to the item count (oversized limit is harmless)", async () => {
    let active = 0;
    let peak = 0;
    await mapWithConcurrency([1, 2], 100, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
    });
    // Only 2 items, so peak can't exceed 2 even with a limit of 100.
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("returns an empty array and runs no tasks for empty input", async () => {
    const task = vi.fn();
    const results = await mapWithConcurrency([], 3, task);
    expect(results).toEqual([]);
    expect(task).not.toHaveBeenCalled();
  });

  it("processes every item with a concurrency of 1 (fully serial)", async () => {
    let active = 0;
    let peak = 0;
    const results = await mapWithConcurrency([1, 2, 3, 4], 1, async (item) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return item * 2;
    });
    expect(results).toEqual([2, 4, 6, 8]);
    expect(peak).toBe(1);
  });
});

describe("runBackfill — state-scoped backfill + prune", () => {
  const ENV_KEYS = [
    "BACKFILL_IMPORT_RATE_PER_SEC",
    "BACKFILL_PRUNE_STALE",
    "BACKFILL_BATCH_SIZE",
    "BACKFILL_CONCURRENCY",
  ];
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    // Disable the rate limiter so imports/deletes don't incur real setTimeout
    // spacing — keeps these tests fast and deterministic.
    process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = "0";
    delete process.env["BACKFILL_PRUNE_STALE"]; // default: prune on
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
    firestoreHolder.current = undefined;
    typesenseHolder.current = undefined;
  });

  it("imports only the scoped state's docs and prunes only that state's stale docs", async () => {
    firestoreHolder.current = makeFirestore({
      clients: [
        { id: "a", data: { stateCode: "US_ID" } },
        { id: "b", data: { stateCode: "US_ID" } },
        { id: "c", data: { stateCode: "US_ND" } },
      ],
    });
    const ts = makeTypesense({
      clients: [
        { id: "a", stateCode: "US_ID" },
        { id: "stale", stateCode: "US_ID" }, // US_ID, absent from Firestore → prune
        { id: "c", stateCode: "US_ND" },
        { id: "d", stateCode: "US_ND" }, // other state → must survive
      ],
    });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [{ name: "clients", fields: ["stateCode"] }],
      "US_ID",
    );

    // Scan was scoped: only US_ID docs imported, the US_ND doc `c` never read.
    expect(ts.importedDocs["clients"]?.map((d) => d["id"]).sort()).toEqual([
      "a",
      "b",
    ]);
    // Export was filtered to the same state.
    expect(ts.exportOptions).toEqual([
      { name: "clients", filter_by: "stateCode:=US_ID" },
    ]);
    // Only the US_ID straggler deleted; US_ND docs untouched.
    expect(ts.deletedIds["clients"]).toEqual(["stale"]);
    expect(summary.collections[0]).toMatchObject({
      name: "clients",
      imported: 2,
      deleted: 1,
    });
    expect(summary.totals).toEqual({ imported: 2, failed: 0, deleted: 1 });
  });

  it("refuses to prune when the scoped Firestore scan is empty (safety valve)", async () => {
    firestoreHolder.current = makeFirestore({
      clients: [{ id: "c", data: { stateCode: "US_ND" } }], // no US_ID docs
    });
    const ts = makeTypesense({
      clients: [{ id: "x", stateCode: "US_ID" }], // US_ID docs DO exist in Typesense
    });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [{ name: "clients", fields: ["stateCode"] }],
      "US_ID",
    );

    // Nothing imported, and the safety valve returns before export/delete so a
    // 0-doc scan can't wipe the state's live index.
    expect(ts.importedDocs["clients"]).toBeUndefined();
    expect(ts.exportOptions).toEqual([]);
    expect(ts.deletedIds["clients"]).toBeUndefined();
    expect(summary.totals).toEqual({ imported: 0, failed: 0, deleted: 0 });
  });

  it("skips the prune entirely when BACKFILL_PRUNE_STALE=false", async () => {
    process.env["BACKFILL_PRUNE_STALE"] = "false";
    firestoreHolder.current = makeFirestore({
      clients: [{ id: "a", data: { stateCode: "US_ID" } }],
    });
    const ts = makeTypesense({
      clients: [
        { id: "a", stateCode: "US_ID" },
        { id: "stale", stateCode: "US_ID" },
      ],
    });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [{ name: "clients", fields: ["stateCode"] }],
      "US_ID",
    );

    expect(ts.importedDocs["clients"]?.map((d) => d["id"])).toEqual(["a"]);
    expect(ts.exportOptions).toEqual([]); // no export
    expect(ts.deletedIds["clients"]).toBeUndefined(); // no deletes
    expect(summary.totals).toEqual({ imported: 1, failed: 0, deleted: 0 });
  });

  it("without a state scope, exports unfiltered and prunes across all states", async () => {
    firestoreHolder.current = makeFirestore({
      clients: [{ id: "a", data: { stateCode: "US_ID" } }],
    });
    const ts = makeTypesense({
      clients: [
        { id: "a", stateCode: "US_ID" },
        { id: "b", stateCode: "US_ND" }, // stale relative to the whole collection
      ],
    });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill([
      { name: "clients", fields: ["stateCode"] },
    ]);

    expect(ts.exportOptions).toEqual([
      { name: "clients", filter_by: undefined },
    ]);
    expect(ts.deletedIds["clients"]).toEqual(["b"]);
    expect(summary.totals.deleted).toBe(1);
  });

  it("paginates the scoped scan and accumulates ids across pages before pruning", async () => {
    process.env["BACKFILL_BATCH_SIZE"] = "2";
    firestoreHolder.current = makeFirestore({
      clients: [
        { id: "a", data: { stateCode: "US_ID" } },
        { id: "b", data: { stateCode: "US_ID" } },
        { id: "c", data: { stateCode: "US_ID" } },
        { id: "z", data: { stateCode: "US_ND" } },
      ],
    });
    const ts = makeTypesense({
      clients: [
        { id: "a", stateCode: "US_ID" },
        { id: "b", stateCode: "US_ID" },
        { id: "c", stateCode: "US_ID" },
        { id: "old", stateCode: "US_ID" }, // stale across the paged scan
      ],
    });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [{ name: "clients", fields: ["stateCode"] }],
      "US_ID",
    );

    // 3 US_ID docs over 2 pages (2 + 1); the prune sees the full set, so only
    // `old` is stale and `z` (US_ND) is never a candidate.
    expect(ts.importedDocs["clients"]?.map((d) => d["id"]).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(ts.deletedIds["clients"]).toEqual(["old"]);
    expect(summary.collections[0]).toMatchObject({
      pages: 2,
      imported: 3,
      deleted: 1,
    });
  });
});

describe("runBackfill — multi-source targets (constantFields + docIdPrefix)", () => {
  const savedRate = process.env["BACKFILL_IMPORT_RATE_PER_SEC"];

  beforeEach(() => {
    process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = "0";
    delete process.env["BACKFILL_PRUNE_STALE"];
  });

  afterEach(() => {
    if (savedRate === undefined)
      delete process.env["BACKFILL_IMPORT_RATE_PER_SEC"];
    else process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = savedRate;
    firestoreHolder.current = undefined;
    typesenseHolder.current = undefined;
  });

  it("reads from sourceCollection, stamps constantFields, and prefixes docIds", async () => {
    firestoreHolder.current = makeFirestore({
      // The unified Typesense target is `opportunities`, but the Firestore
      // source is per-state, per-opp. Same-person collision: both `US_TN_CR`
      // and `US_TN_LSU` key their record for person ABC as `US_TN_ABC`.
      US_TN_compliantReporting: [
        { id: "US_TN_ABC", data: { externalId: "ABC" } },
      ],
      US_TN_LSU: [{ id: "US_TN_ABC", data: { externalId: "ABC" } }],
    });
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill([
      {
        name: "opportunities",
        sourceCollection: "US_TN_compliantReporting",
        fields: ["externalId"],
        constantFields: {
          stateCode: "US_TN",
          opportunityType: "compliantReporting",
        },
        docIdPrefix: "compliantReporting",
      },
      {
        name: "opportunities",
        sourceCollection: "US_TN_LSU",
        fields: ["externalId"],
        constantFields: { stateCode: "US_TN", opportunityType: "LSU" },
        docIdPrefix: "LSU",
      },
    ]);

    // Both source docs land in `opportunities` with prefixed ids — no collision.
    const imported = ts.importedDocs["opportunities"] ?? [];
    expect(imported.map((d) => d["id"]).sort()).toEqual([
      "LSU_US_TN_ABC",
      "compliantReporting_US_TN_ABC",
    ]);
    // constantFields stamped on every emitted doc.
    expect(imported.every((d) => d["stateCode"] === "US_TN")).toBe(true);
    expect(imported.map((d) => d["opportunityType"]).sort()).toEqual([
      "LSU",
      "compliantReporting",
    ]);
    expect(summary.totals).toEqual({ imported: 2, failed: 0, deleted: 0 });
  });

  it("prunes only within its own (stateCode, opportunityType) partition", async () => {
    firestoreHolder.current = makeFirestore({
      US_TN_compliantReporting: [{ id: "keep", data: { externalId: "K" } }],
    });
    const ts = makeTypesense({
      opportunities: [
        // Prefixed CR doc matching Firestore → survives.
        {
          id: "compliantReporting_keep",
          stateCode: "US_TN",
          opportunityType: "compliantReporting",
        },
        // Prefixed CR doc absent from Firestore → THIS partition's stragler.
        {
          id: "compliantReporting_stale",
          stateCode: "US_TN",
          opportunityType: "compliantReporting",
        },
        // Different opp type in the same state → must NOT be deleted by CR run.
        {
          id: "LSU_alive",
          stateCode: "US_TN",
          opportunityType: "LSU",
        },
        // Different state, same opp type → must NOT be deleted either.
        {
          id: "compliantReporting_othertate",
          stateCode: "US_ID",
          opportunityType: "compliantReporting",
        },
      ],
    });
    typesenseHolder.current = ts.client;

    await runBackfill([
      {
        name: "opportunities",
        sourceCollection: "US_TN_compliantReporting",
        fields: ["externalId"],
        constantFields: {
          stateCode: "US_TN",
          opportunityType: "compliantReporting",
        },
        docIdPrefix: "compliantReporting",
      },
    ]);

    // Export scoped to this source's partition only.
    expect(ts.exportOptions).toEqual([
      {
        name: "opportunities",
        filter_by: "stateCode:=US_TN && opportunityType:=compliantReporting",
      },
    ]);
    // Only the in-partition stragler deleted.
    expect(ts.deletedIds["opportunities"]).toEqual([
      "compliantReporting_stale",
    ]);
  });

  it("skips sources whose constantFields.stateCode doesn't match the invocation stateCode", async () => {
    firestoreHolder.current = makeFirestore({
      US_TN_compliantReporting: [
        { id: "US_TN_ABC", data: { stateCode: "US_TN" } },
      ],
      US_ID_compliantReporting: [
        { id: "US_ID_XYZ", data: { stateCode: "US_ID" } },
      ],
    });
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    await runBackfill(
      [
        {
          name: "opportunities",
          sourceCollection: "US_TN_compliantReporting",
          fields: [],
          constantFields: {
            stateCode: "US_TN",
            opportunityType: "compliantReporting",
          },
          docIdPrefix: "compliantReporting",
        },
        {
          name: "opportunities",
          sourceCollection: "US_ID_compliantReporting",
          fields: [],
          constantFields: {
            stateCode: "US_ID",
            opportunityType: "compliantReporting",
          },
          docIdPrefix: "compliantReporting",
        },
      ],
      "US_TN",
    );

    // Only the US_TN source ran; US_ID source was skipped entirely (no
    // import, no export, no delete).
    const imported = ts.importedDocs["opportunities"] ?? [];
    expect(imported.map((d) => d["id"])).toEqual([
      "compliantReporting_US_TN_ABC",
    ]);
    expect(ts.exportOptions).toEqual([
      {
        name: "opportunities",
        filter_by: "stateCode:=US_TN && opportunityType:=compliantReporting",
      },
    ]);
  });

  it("filters an opportunity source scan by stateCode even when constantFields pins the state", async () => {
    // The ETL validates `stateCode` on every opportunity document it writes, so
    // the scan is always state-filtered — including for sources whose
    // constantFields already pin the state. A document missing `stateCode` is
    // silently excluded, which is only safe because of that ETL guarantee.
    firestoreHolder.current = makeFirestore({
      US_TN_compliantReporting: [
        { id: "US_TN_ABC", data: { externalId: "ABC", stateCode: "US_TN" } },
        { id: "US_ID_XYZ", data: { externalId: "XYZ", stateCode: "US_ID" } },
        { id: "US_TN_NOSC", data: { externalId: "NOSC" } },
      ],
    });
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [
        {
          name: "opportunities",
          sourceCollection: "US_TN_compliantReporting",
          fields: ["externalId"],
          constantFields: {
            stateCode: "US_TN",
            opportunityType: "compliantReporting",
          },
          docIdPrefix: "compliantReporting",
        },
      ],
      "US_TN",
    );

    expect(summary.totals.imported).toBe(1);
    expect(ts.importedDocs["opportunities"]).toEqual([
      expect.objectContaining({ externalId: "ABC" }),
    ]);
  });
});

describe("runBackfill — template config + invocation sourceCollection", () => {
  const savedRate = process.env["BACKFILL_IMPORT_RATE_PER_SEC"];

  beforeEach(() => {
    process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = "0";
    delete process.env["BACKFILL_PRUNE_STALE"];
  });

  afterEach(() => {
    if (savedRate === undefined)
      delete process.env["BACKFILL_IMPORT_RATE_PER_SEC"];
    else process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = savedRate;
    firestoreHolder.current = undefined;
    typesenseHolder.current = undefined;
  });

  it("instantiates a template config from the invocation sourceCollection", async () => {
    // The path the opportunity ETL trigger takes: the named Firestore source
    // imports into the shared `opportunities` target, prefixed and stamped.
    firestoreHolder.current = makeFirestore({
      "US_TN-compliantReportingReferrals": [
        {
          id: "US_TN_ABC",
          data: {
            externalId: "ABC",
            opportunityType: "compliantReporting",
            stateCode: "US_TN",
          },
        },
      ],
    });
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [
        {
          name: "opportunities",
          fields: ["externalId", "opportunityType", "stateCode"],
        },
      ],
      undefined,
      "US_TN-compliantReportingReferrals",
    );

    const imported = ts.importedDocs["opportunities"] ?? [];
    expect(imported).toHaveLength(1);
    expect(imported[0]).toMatchObject({
      id: "US_TN-compliantReportingReferrals_US_TN_ABC",
      externalId: "ABC",
      opportunityType: "compliantReporting",
      stateCode: "US_TN",
      sourceCollection: "US_TN-compliantReportingReferrals",
    });
    // Prune scoped to just this source's partition.
    expect(ts.exportOptions).toEqual([
      {
        name: "opportunities",
        filter_by: "sourceCollection:=US_TN-compliantReportingReferrals",
      },
    ]);
    expect(summary.totals).toEqual({ imported: 1, failed: 0, deleted: 0 });
  });

  it("a bare invocation of the template (no sourceCollection) scans the target name and returns zero imports", async () => {
    // A caller mistake surfaces as `{ imported: 0 }` rather than an error —
    // safe, because the prune's empty-scan valve blocks any delete.
    firestoreHolder.current = makeFirestore({});
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [{ name: "opportunities", fields: ["externalId"] }],
      undefined,
      undefined,
    );
    expect(summary.totals).toEqual({ imported: 0, failed: 0, deleted: 0 });
  });
});
