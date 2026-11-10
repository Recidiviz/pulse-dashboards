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

import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

const { getPrismaClientForStateCode } = vi.hoisted(() => ({
  getPrismaClientForStateCode: vi.fn(),
}));

vi.mock("../utils", () => ({ getPrismaClientForStateCode }));

describe("seed module", () => {
  const originalEntryFile = process.argv[1];

  afterEach(() => {
    process.argv[1] = originalEntryFile;
    vi.resetModules();
  });

  // The seed-db job bundles this module into its own entry file, so
  // process.argv[1] can name the module itself. Importing it must still not
  // start a seed: the job's main() already runs one.
  it("does not start a seed when it is the process entry file", async () => {
    process.argv[1] = join(import.meta.dirname, "..", "seed.ts");

    await import("../seed");

    expect(getPrismaClientForStateCode).not.toHaveBeenCalled();
  });
});
