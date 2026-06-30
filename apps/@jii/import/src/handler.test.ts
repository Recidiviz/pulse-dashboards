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

import { MockStorage } from "mock-gcs";
import { beforeEach } from "vitest";

import { NC_RNA_FILE_NAME, RESIDENTS_FILE_NAME } from "./constants";
import { getImportHandler } from "./handler";
import { residentHandler } from "./handlers/resident/resident";
import { transformAndLoadRNAWritebackData } from "./handlers/usNcRNA/usNcRNA";

// Mock GCS so getDataFromGCS never touches a real bucket
let mockStorage: MockStorage;

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn().mockImplementation(() => mockStorage),
}));

// Mock Prisma so any state code is accepted without a real DB connection
vi.mock("~@jii/prisma", () => ({
  getPrismaClientForStateCode: () => ({ $disconnect: () => Promise.resolve() }),
}));

// Replace the loaderFns with spies so we can assert call/no-call without real DB writes
vi.mock("./handlers/usNcRNA/usNcRNA", () => ({
  transformAndLoadRNAWritebackData: vi.fn(),
}));

vi.mock("./handlers/resident/resident", () => ({
  residentHandler: vi.fn(),
}));

describe("import handler state code prefix filtering", () => {
  let importHandler: ReturnType<typeof getImportHandler>;

  beforeEach(() => {
    // silence logging noise
    vi.spyOn(console, "log").mockImplementation(vi.fn());
    vi.spyOn(console, "warn").mockImplementation(vi.fn());
  });

  beforeEach(() => {
    mockStorage = new MockStorage();
    process.env["IMPORT_BUCKET_ID"] = "test-bucket";
    importHandler = getImportHandler();
    vi.mocked(transformAndLoadRNAWritebackData).mockClear();
    vi.mocked(residentHandler).mockClear();
  });

  it("skips a state-prefixed file when importing for a non-matching state", async () => {
    await mockStorage
      .bucket("test-bucket")
      .file(`US_ID/${NC_RNA_FILE_NAME}`)
      .save("");

    await importHandler.import("US_ID", [NC_RNA_FILE_NAME]);

    expect(transformAndLoadRNAWritebackData).not.toHaveBeenCalled();
  });

  it("imports a state-prefixed file when importing for the matching state", async () => {
    await mockStorage
      .bucket("test-bucket")
      .file(`US_NC/${NC_RNA_FILE_NAME}`)
      .save("");

    await importHandler.import("US_NC", [NC_RNA_FILE_NAME]);

    expect(transformAndLoadRNAWritebackData).toHaveBeenCalled();
  });

  it("imports a non-prefixed file regardless of state", async () => {
    await mockStorage
      .bucket("test-bucket")
      .file(`US_ID/${RESIDENTS_FILE_NAME}`)
      .save("");

    await importHandler.import("US_ID", [RESIDENTS_FILE_NAME]);

    expect(residentHandler).toHaveBeenCalled();
  });
});
