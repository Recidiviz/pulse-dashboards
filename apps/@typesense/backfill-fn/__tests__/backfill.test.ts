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

import { runBackfill } from "../src/backfill";

// ---------------------------------------------------------------------------
// Integration harness for runBackfill: fake Firestore + Typesense clients wired
// in via module mocks, so the real backfill + prune flow (paging, projection,
// import, export-diff, delete) can be driven without a live cluster or emulator.
// ---------------------------------------------------------------------------

type FakeDoc = {
  id: string;
  data: Record<string, unknown>;
};

// Merge sources are addressed by document PATH, not id — that's what carries
// the parent record id for a subcollection doc.
type FakePathDoc = {
  path: string;
  data: Record<string, unknown>;
};

type FakeSnapshot = {
  empty: boolean;
  size: number;
  docs: Array<{
    id: string;
    data: () => Record<string, unknown>;
    ref: { path: string };
  }>;
};

type FakeQuery = {
  where: (field: string, op: string, value: unknown) => FakeQuery;
  orderBy: (field?: unknown) => FakeQuery;
  limit: (n: number) => FakeQuery;
  startAfter: (cursor: { id: string }) => FakeQuery;
  select: (...fields: string[]) => FakeQuery;
  get: () => Promise<FakeSnapshot>;
};

type FakeFirestore = {
  collection: (name: string) => FakeQuery;
  collectionGroup: (name: string) => FakeQuery;
};

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
// `groups` registers docs reachable via collectionGroup(), keyed by group name,
// each carrying its full Firestore path so mergeDocIdFromPath has something to
// parse.
// `hooks.onSelect` fires on every select() call. Because the prune's confirming
// scan is the ONLY caller of select(), it doubles as a precise probe for "did the
// confirming scan run" — and a test can throw from it to exercise the
// confirming-scan failure path.
function makeFirestore(
  collections: Record<string, FakeDoc[]>,
  groups: Record<string, FakePathDoc[]> = {},
  hooks: { onSelect?: (fields: string[]) => void } = {},
): FakeFirestore {
  function query(
    name: string,
    opts: {
      state?: string;
      afterId?: string;
      limit?: number;
      // Field mask from select(). `undefined` = no select() called (full data);
      // `[]` = a bare select() (document refs only, empty data).
      select?: string[];
    },
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
      // Mirrors Firestore's field mask, including the case that matters for the
      // prune's confirming scan: a bare select() yields docs whose data() is
      // EMPTY. Masking faithfully is what makes the field-composed-id test real
      // — a fake that ignored the mask would pass even if scanSourceIds forgot
      // to select the id fields.
      select: (...fields) => {
        hooks.onSelect?.(fields);
        return query(name, { ...opts, select: fields });
      },
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
        const mask = opts.select;
        const project = (data: Record<string, unknown>) => {
          if (mask === undefined) return data;
          const out: Record<string, unknown> = {};
          for (const f of mask) if (f in data) out[f] = data[f];
          return out;
        };
        return {
          empty: page.length === 0,
          size: page.length,
          docs: page.map((d) => ({
            id: d.id,
            data: () => project(d.data),
            ref: { path: `${name}/${d.id}` },
          })),
        };
      },
    };
  }

  // Collection groups are read whole (no paging or state filter), matching how
  // loadMergeDocuments queries them.
  function groupQuery(name: string): FakeQuery {
    const self: FakeQuery = {
      where: () => self,
      orderBy: () => self,
      limit: () => self,
      startAfter: () => self,
      select: () => self,
      get: async () => {
        const docs = groups[name] ?? [];
        return {
          empty: docs.length === 0,
          size: docs.length,
          docs: docs.map((d) => ({
            id: d.path.split("/").pop() ?? "",
            data: () => d.data,
            ref: { path: d.path },
          })),
        };
      },
    };
    return self;
  }

  return {
    collection: (name) => query(name, {}),
    collectionGroup: (name) => groupQuery(name),
  };
}

// `id` is required; any other keys are
// arbitrary so callers can pin constantFields discriminators (stateCode,
// opportunityType, …) that the filter_by parser matches on.
type TypesenseDoc = Record<string, unknown> & { id: string };

// Records imports/exports/deletes for assertions. export() honors filter_by
// as either a single `key:=value` clause or several joined by ` && `, matching
// how buildPruneFilter emits them — so the fake mirrors the cluster's scoping.
// `hooks.onExport` fires at the start of export(), which is the moment BETWEEN
// the import scan and the prune's confirming scan. That makes it the seam for
// simulating an ETL write landing mid-backfill: the hook pushes the new doc into
// both fakes, so the export returns it (as the realtime sync extension would)
// and the confirming scan then finds it in Firestore.
function makeTypesense(
  existing: Record<string, TypesenseDoc[]>,
  hooks: { onExport?: () => void } = {},
) {
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
          hooks.onExport?.();
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

// The import scan builds `firestoreIds` over minutes on a large collection, and
// the realtime sync extension indexes Firestore writes as they land. So a doc the
// ETL writes behind the scan cursor is in the Typesense export but not in the
// snapshot — it looks stale while being live. The prune re-scans Firestore after
// the export and keeps only candidates still absent.
describe("runBackfill — confirming prune candidates against Firestore", () => {
  const ENV_KEYS = ["BACKFILL_IMPORT_RATE_PER_SEC", "BACKFILL_PRUNE_STALE"];
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    process.env["BACKFILL_IMPORT_RATE_PER_SEC"] = "0";
    delete process.env["BACKFILL_PRUNE_STALE"];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
    firestoreHolder.current = undefined;
    typesenseHolder.current = undefined;
  });

  it("spares a doc written mid-scan but deletes one that is genuinely gone", async () => {
    // `a` was scanned. `gone` is in Typesense only — genuinely stale. `late`
    // arrives during the run, after the scan has already passed its page.
    const fsClients: FakeDoc[] = [{ id: "a", data: { stateCode: "US_ID" } }];
    const tsClients: TypesenseDoc[] = [
      { id: "a", stateCode: "US_ID" },
      { id: "gone", stateCode: "US_ID" },
    ];

    firestoreHolder.current = makeFirestore({ clients: fsClients });
    const ts = makeTypesense(
      { clients: tsClients },
      {
        onExport: () => {
          // The ETL writes `late`; the realtime extension indexes it at once. So
          // it is visible to this export AND to the confirming scan that follows.
          fsClients.push({ id: "late", data: { stateCode: "US_ID" } });
          tsClients.push({ id: "late", stateCode: "US_ID" });
        },
      },
    );
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [{ name: "clients", fields: ["stateCode"] }],
      "US_ID",
    );

    // Both `gone` and `late` were candidates; only `gone` survives confirmation.
    expect(ts.deletedIds["clients"]).toEqual(["gone"]);
    expect(summary.collections[0]).toMatchObject({ imported: 1, deleted: 1 });
  });

  it("does not confirm-scan at all when nothing looks stale", async () => {
    const selectCalls: string[][] = [];
    firestoreHolder.current = makeFirestore(
      { clients: [{ id: "a", data: { stateCode: "US_ID" } }] },
      {},
      { onSelect: (fields) => selectCalls.push(fields) },
    );
    const ts = makeTypesense({ clients: [{ id: "a", stateCode: "US_ID" }] });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [{ name: "clients", fields: ["stateCode"] }],
      "US_ID",
    );

    // The common path must pay nothing for this guard.
    expect(selectCalls).toEqual([]);
    expect(ts.deletedIds["clients"]).toBeUndefined();
    expect(summary.totals.deleted).toBe(0);
  });

  it("selects the id fields when the doc id is field-composed", async () => {
    // The `opportunities` shape: the id comes from document FIELDS, so the
    // confirming scan must project those fields. A bare select() would blank the
    // data, collapse every composed id to the Firestore doc id, confirm nothing,
    // and delete the live doc below.
    const selectCalls: string[][] = [];
    const fsOpps: FakeDoc[] = [
      {
        id: "1",
        data: {
          stateCode: "US_TN",
          externalId: "123",
          opportunityType: "usTnLSU",
        },
      },
    ];
    const tsOpps: TypesenseDoc[] = [
      { id: "us_tn_123_usTnLSU", stateCode: "US_TN" },
    ];

    firestoreHolder.current = makeFirestore(
      { opportunities: fsOpps },
      {},
      {
        onSelect: (fields) => selectCalls.push(fields),
      },
    );
    const ts = makeTypesense(
      { opportunities: tsOpps },
      {
        onExport: () => {
          fsOpps.push({
            id: "2",
            data: {
              stateCode: "US_TN",
              externalId: "456",
              opportunityType: "usTnLSU",
            },
          });
          tsOpps.push({ id: "us_tn_456_usTnLSU", stateCode: "US_TN" });
        },
      },
    );
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [
        {
          name: "opportunities",
          fields: ["stateCode", "externalId", "opportunityType"],
          docIdOverrides: {
            type: "fields",
            fields: ["stateCode", "externalId", "opportunityType"],
            lowercaseFields: ["stateCode"],
          },
        },
      ],
      "US_TN",
    );

    expect(selectCalls).toEqual([
      ["stateCode", "externalId", "opportunityType"],
    ]);
    // The mid-run opportunity survives, which only works if the mask above let
    // the confirming scan recompose its id.
    expect(ts.deletedIds["opportunities"]).toBeUndefined();
    expect(summary.totals.deleted).toBe(0);
  });

  it("deletes nothing when the confirming scan fails", async () => {
    firestoreHolder.current = makeFirestore(
      { clients: [{ id: "a", data: { stateCode: "US_ID" } }] },
      {},
      {
        onSelect: () => {
          throw new Error("firestore unavailable");
        },
      },
    );
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

    // `stale` really is stale, but unconfirmed is unconfirmed — skip, don't
    // guess. The next run reconciles.
    expect(ts.deletedIds["clients"]).toBeUndefined();
    expect(summary.collections[0]).toMatchObject({ imported: 1, deleted: 0 });
  });
});

describe("runBackfill — multi-source targets (constantFields + docIdOverrides)", () => {
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
        docIdOverrides: { type: "prefix", prefix: "compliantReporting" },
      },
      {
        name: "opportunities",
        sourceCollection: "US_TN_LSU",
        fields: ["externalId"],
        constantFields: { stateCode: "US_TN", opportunityType: "LSU" },
        docIdOverrides: { type: "prefix", prefix: "LSU" },
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
        docIdOverrides: { type: "prefix", prefix: "compliantReporting" },
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
          docIdOverrides: { type: "prefix", prefix: "compliantReporting" },
        },
        {
          name: "opportunities",
          sourceCollection: "US_ID_compliantReporting",
          fields: [],
          constantFields: {
            stateCode: "US_ID",
            opportunityType: "compliantReporting",
          },
          docIdOverrides: { type: "prefix", prefix: "compliantReporting" },
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
          docIdOverrides: { type: "prefix", prefix: "compliantReporting" },
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

describe("runBackfill — merging user updates onto the record", () => {
  beforeEach(() => {
    firestoreHolder.current = undefined;
    typesenseHolder.current = undefined;
  });

  const OPPORTUNITY_CONFIG = {
    name: "opportunities",
    fields: ["stateCode", "externalId", "opportunityType", "isEligible"],
    docIdOverrides: {
      type: "fields" as const,
      fields: ["stateCode", "externalId", "opportunityType", "opportunityId"],
      lowercaseFields: ["stateCode"],
    },
    mergeSources: [
      {
        sourceCollection: "clientOpportunityUpdates",
        collectionGroup: true,
        fields: ["denial", "submitted"],
      },
    ],
  };

  it("merges the officer's action onto the ETL-sourced opportunity", async () => {
    firestoreHolder.current = makeFirestore(
      {
        "US_TN-compliantReportingReferrals": [
          {
            id: "us_tn_123",
            data: {
              stateCode: "US_TN",
              externalId: "123",
              opportunityType: "usTnExpiration",
              isEligible: true,
            },
          },
        ],
      },
      {
        clientOpportunityUpdates: [
          {
            path: "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
            data: { denial: { reasons: ["X"] }, submitted: { by: "o@e.com" } },
          },
        ],
      },
    );
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    await runBackfill(
      [OPPORTUNITY_CONFIG],
      "US_TN",
      "US_TN-compliantReportingReferrals",
    );

    // One document carrying both halves.
    expect(ts.importedDocs["opportunities"]).toEqual([
      expect.objectContaining({
        id: "us_tn_123_usTnExpiration",
        isEligible: true,
        opportunityType: "usTnExpiration",
        denial: { reasons: ["X"] },
        submitted: { by: "o@e.com" },
      }),
    ]);
  });

  it("leaves update fields off an opportunity nobody has acted on", async () => {
    firestoreHolder.current = makeFirestore(
      {
        "US_TN-compliantReportingReferrals": [
          {
            id: "us_tn_999",
            data: {
              stateCode: "US_TN",
              externalId: "999",
              opportunityType: "usTnExpiration",
              isEligible: true,
            },
          },
        ],
      },
      { clientOpportunityUpdates: [] },
    );
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    await runBackfill(
      [OPPORTUNITY_CONFIG],
      "US_TN",
      "US_TN-compliantReportingReferrals",
    );

    const [doc] = ts.importedDocs["opportunities"];
    expect(doc).not.toHaveProperty("denial");
    expect(doc).not.toHaveProperty("submitted");
  });

  it("matches a multi-instance opportunity whose Firestore doc id differs from the composed id", async () => {
    // The Oregon shape: the ETL keys the document `us_or_1234_<opportunityId>`,
    // but `externalId` on the document is still the person's id. Composing from
    // fields rather than parsing the doc id is what makes this line up with the
    // update path `clientUpdatesV2/us_or_1234/.../usOrEarnedDischarge_span2`.
    firestoreHolder.current = makeFirestore(
      {
        "US_OR-earnedDischargeReferrals": [
          {
            id: "us_or_1234_span2",
            data: {
              stateCode: "US_OR",
              externalId: "1234",
              opportunityType: "usOrEarnedDischarge",
              opportunityId: "span2",
              isEligible: true,
            },
          },
        ],
      },
      {
        clientOpportunityUpdates: [
          {
            path: "clientUpdatesV2/us_or_1234/clientOpportunityUpdates/usOrEarnedDischarge_span2",
            data: { denial: { reasons: ["OR"] } },
          },
        ],
      },
    );
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    await runBackfill(
      [OPPORTUNITY_CONFIG],
      "US_OR",
      "US_OR-earnedDischargeReferrals",
    );

    expect(ts.importedDocs["opportunities"]).toEqual([
      expect.objectContaining({
        id: "us_or_1234_usOrEarnedDischarge_span2",
        denial: { reasons: ["OR"] },
      }),
    ]);
  });

  it("preserves externalId casing so mixed-case person ids still match", async () => {
    // Person record ids are `<lowercase state>_<externalId>` with the external
    // id left as-is (us_ne_RES001), so only stateCode may be lowercased.
    firestoreHolder.current = makeFirestore(
      {
        "US_NE-goodTimeReferrals": [
          {
            id: "us_ne_RES001",
            data: {
              stateCode: "US_NE",
              externalId: "RES001",
              opportunityType: "usNeGoodTimeRestoration",
              isEligible: true,
            },
          },
        ],
      },
      {
        clientOpportunityUpdates: [
          {
            path: "clientUpdatesV2/us_ne_RES001/clientOpportunityUpdates/usNeGoodTimeRestoration",
            data: { submitted: { by: "o@e.com" } },
          },
        ],
      },
    );
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    await runBackfill([OPPORTUNITY_CONFIG], "US_NE", "US_NE-goodTimeReferrals");

    expect(ts.importedDocs["opportunities"]).toEqual([
      expect.objectContaining({
        id: "us_ne_RES001_usNeGoodTimeRestoration",
        submitted: { by: "o@e.com" },
      }),
    ]);
  });

  it("ignores an update whose opportunity is no longer in the ETL source", async () => {
    // Merge docs only decorate; they never create a Typesense document, so a
    // dropped opportunity stays dropped and the prune stays correct.
    firestoreHolder.current = makeFirestore(
      { "US_TN-compliantReportingReferrals": [] },
      {
        clientOpportunityUpdates: [
          {
            path: "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
            data: { denial: { reasons: ["X"] } },
          },
        ],
      },
    );
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    const summary = await runBackfill(
      [OPPORTUNITY_CONFIG],
      "US_TN",
      "US_TN-compliantReportingReferrals",
    );

    expect(ts.importedDocs["opportunities"]).toBeUndefined();
    expect(summary.totals.imported).toBe(0);
  });

  it("skips updates belonging to a different state when the run is scoped", async () => {
    firestoreHolder.current = makeFirestore(
      {
        "US_TN-compliantReportingReferrals": [
          {
            id: "us_tn_123",
            data: {
              stateCode: "US_TN",
              externalId: "123",
              opportunityType: "usTnExpiration",
              isEligible: true,
            },
          },
        ],
      },
      {
        clientOpportunityUpdates: [
          {
            path: "clientUpdatesV2/us_id_123/clientOpportunityUpdates/usTnExpiration",
            data: { denial: { reasons: ["WRONG STATE"] } },
          },
        ],
      },
    );
    const ts = makeTypesense({ opportunities: [] });
    typesenseHolder.current = ts.client;

    await runBackfill(
      [OPPORTUNITY_CONFIG],
      "US_TN",
      "US_TN-compliantReportingReferrals",
    );

    const [doc] = ts.importedDocs["opportunities"];
    expect(doc).not.toHaveProperty("denial");
  });

  it("merges preferredName onto a person record by record id", async () => {
    firestoreHolder.current = makeFirestore({
      clients: [
        {
          id: "us_tn_123",
          data: { stateCode: "US_TN", personExternalId: "123" },
        },
      ],
      clientUpdatesV2: [
        { id: "us_tn_123", data: { preferredName: "Bo", stateCode: "us_tn" } },
      ],
    });
    const ts = makeTypesense({ clients: [] });
    typesenseHolder.current = ts.client;

    await runBackfill([
      {
        name: "clients",
        fields: ["stateCode", "personExternalId"],
        mergeSources: [
          { sourceCollection: "clientUpdatesV2", fields: ["preferredName"] },
        ],
      },
    ]);

    expect(ts.importedDocs["clients"]).toEqual([
      expect.objectContaining({ id: "us_tn_123", preferredName: "Bo" }),
    ]);
  });

  it("does not let a merge field overwrite the composed id", async () => {
    firestoreHolder.current = makeFirestore({
      clients: [{ id: "us_tn_123", data: { stateCode: "US_TN" } }],
      clientUpdatesV2: [
        { id: "us_tn_123", data: { preferredName: "Bo", id: "hijacked" } },
      ],
    });
    const ts = makeTypesense({ clients: [] });
    typesenseHolder.current = ts.client;

    await runBackfill([
      {
        name: "clients",
        fields: ["stateCode"],
        mergeSources: [
          {
            sourceCollection: "clientUpdatesV2",
            fields: ["preferredName", "id"],
          },
        ],
      },
    ]);

    const [doc] = ts.importedDocs["clients"];
    expect(doc["id"]).toBe("us_tn_123");
  });
});
