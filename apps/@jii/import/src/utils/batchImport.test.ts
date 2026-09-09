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

import { mock } from "vitest-mock-extended";

import { type PrismaClient } from "~@jii/prisma";
import { type LoaderContext } from "~data-import-plugin";

import {
  type BatchImportModel,
  DELETE_CHUNK_SIZE,
  type ImportRow,
  runBatchImport,
} from "./batchImport";

/*
 * These cover the prune step's bookkeeping, which is about which ids get deleted rather than
 * about SQL. The handler tests exercise the same code against a real database.
 */

type TestRecord = { id: string; value: string };

function testModel(existingIds: string[]) {
  return mock<BatchImportModel<ImportRow<TestRecord>>>({
    findMany: vi.fn().mockResolvedValue(existingIds.map((id) => ({ id }))),
    createMany: vi.fn().mockResolvedValue(undefined),
    deleteMany: vi.fn().mockResolvedValue(undefined),
  });
}

async function* recordsFor(ids: string[]) {
  for (const id of ids) {
    yield { id, value: "imported" };
  }
}

function contextFor(
  skippedRowIds: string[],
  unidentifiedSkippedRowCount = 0,
): LoaderContext {
  return { skippedRowIds: new Set(skippedRowIds), unidentifiedSkippedRowCount };
}

function runImport({
  model,
  data,
  context,
  pruneStale = true,
}: {
  model: BatchImportModel<ImportRow<TestRecord>>;
  data: AsyncIterable<TestRecord>;
  context: LoaderContext;
  pruneStale?: boolean;
}) {
  return runBatchImport({
    prismaClient: mock<PrismaClient>(),
    model,
    tableName: "TestRecord",
    idField: "id",
    batchSize: 500,
    pruneStale,
    data,
    context,
  });
}

/** The ids passed to deleteMany, across however many calls it took. */
function deletedIdsByCall(model: BatchImportModel<ImportRow<TestRecord>>) {
  return vi
    .mocked(model.deleteMany)
    .mock.calls.map(([{ where }]) => (where["id"] as { in: string[] }).in);
}

describe("runBatchImport prune", () => {
  // the decision about what a skipped row means for existing data belongs to this function
  // rather than the import handler, so the reporting of that decision lives here too
  let warn: ReturnType<typeof vi.spyOn>;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(vi.fn());
    log = vi.spyOn(console, "log").mockImplementation(vi.fn());
  });

  it("deletes records missing from the import", async () => {
    const model = testModel(["a", "b", "c"]);

    await runImport({
      model,
      data: recordsFor(["a"]),
      context: contextFor([]),
    });

    expect(deletedIdsByCall(model)).toEqual([["b", "c"]]);
  });

  it("keeps records whose incoming data could not be parsed", async () => {
    const model = testModel(["a", "b", "c"]);

    await runImport({
      model,
      data: recordsFor(["a"]),
      context: contextFor(["b"]),
    });

    expect(deletedIdsByCall(model)).toEqual([["c"]]);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Keeping 1 existing TestRecord record(s)"),
    );
  });

  it("deletes nothing when a skipped row could not be identified", async () => {
    const model = testModel(["a", "b", "c"]);

    await runImport({
      model,
      data: recordsFor(["a"]),
      context: contextFor([], 1),
    });

    expect(model.deleteMany).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Not removing any TestRecord records"),
    );
  });

  it("does not query when there is nothing to delete", async () => {
    const model = testModel(["a"]);

    await runImport({
      model,
      data: recordsFor(["a"]),
      context: contextFor([]),
    });

    expect(model.deleteMany).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining("Keeping"));
  });

  it("deletes in chunks", async () => {
    const staleIds = Array.from(
      { length: DELETE_CHUNK_SIZE + 1 },
      (_, i) => `stale${i}`,
    );
    const model = testModel(["a", ...staleIds]);

    await runImport({
      model,
      data: recordsFor(["a"]),
      context: contextFor([]),
    });

    const calls = deletedIdsByCall(model);
    expect(calls.map((ids) => ids.length)).toEqual([DELETE_CHUNK_SIZE, 1]);
    expect(calls.flat()).toEqual(staleIds);
  });

  it("does not delete anything when pruneStale is false", async () => {
    const model = testModel(["a", "b"]);

    await runImport({
      model,
      data: recordsFor(["a"]),
      context: contextFor(["b"]),
      pruneStale: false,
    });

    expect(model.deleteMany).not.toHaveBeenCalled();
  });

  it("does not delete anything when the import data fails partway through", async () => {
    const model = testModel(["a", "b", "c"]);

    async function* failingData() {
      yield { id: "a", value: "imported" };
      throw new Error("GCS is having a day");
    }

    await expect(
      runImport({ model, data: failingData(), context: contextFor([]) }),
    ).rejects.toThrow("GCS is having a day");

    expect(model.deleteMany).not.toHaveBeenCalled();
  });
});
