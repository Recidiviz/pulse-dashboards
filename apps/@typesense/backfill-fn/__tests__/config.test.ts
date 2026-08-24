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
  resolveBatchSize,
  resolveConcurrency,
  resolveImportRatePerSec,
  resolvePruneStale,
} from "../src/config";

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
