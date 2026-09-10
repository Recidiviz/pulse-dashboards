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

import { afterEach, describe, expect, test, vi } from "vitest";

const importMock = vi.fn().mockResolvedValue(undefined);

vi.mock("~@meetings/import/handler", () => ({
  getImportHandler: () => ({ import: importMock }),
}));

describe("main", () => {
  afterEach(() => {
    delete process.env["STATE_CODE"];
    delete process.env["FILES"];
    importMock.mockClear();
    vi.resetModules();
  });

  test("without a FILES env var, imports only the non-CNI files", async () => {
    process.env["STATE_CODE"] = "US_XX";

    await import("~@meetings/import/main");

    expect(importMock).toHaveBeenCalledWith("US_XX", [
      "clients.json",
      "residents.json",
      "staff.json",
    ]);
  });

  test("with a FILES env var set (e.g. a manual CNI import), imports only those files", async () => {
    process.env["STATE_CODE"] = "US_XX";
    process.env["FILES"] = "case_note_insights_employment_summary.json";

    await import("~@meetings/import/main");

    expect(importMock).toHaveBeenCalledWith("US_XX", [
      "case_note_insights_employment_summary.json",
    ]);
  });

  test("throws if STATE_CODE is missing", async () => {
    await expect(import("~@meetings/import/main")).rejects.toThrow(
      "Missing state code environment variable",
    );
  });
});
