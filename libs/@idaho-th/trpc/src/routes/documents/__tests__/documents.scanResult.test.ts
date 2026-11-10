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

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyDocumentScanResult,
  deriveVerdictFromBucket,
  isCleanBucketWithScanDisabled,
} from "../documents.service";

const gcsMocks = vi.hoisted(() => ({
  deleteGcsObject: vi.fn(),
  gcsConfig: {
    bucketName: "test-bucket",
    cleanBucketName: "test-clean-bucket",
    quarantinedBucketName: "test-quarantine-bucket",
    malwareScanEnabled: true,
  },
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  gcsConfig: gcsMocks.gcsConfig,
  deleteGcsObject: gcsMocks.deleteGcsObject,
  resolveGcsReadAccess: vi.fn(),
  generateResumableUploadUrl: vi.fn(),
  gcsObjectExists: vi.fn(),
}));

const uploadBucketName = "test-bucket";
const cleanBucketName = "test-clean-bucket";
const quarantineBucketName = "test-quarantine-bucket";
const objectKey = "applications/app-1/documents/doc-1.pdf";

beforeEach(() => {
  vi.clearAllMocks();
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
  gcsMocks.gcsConfig.malwareScanEnabled = true;
});

function prismaWith(updateManyCount: number, findFirstResult: unknown) {
  const updateMany = vi.fn().mockResolvedValue({ count: updateManyCount });
  const findFirst = vi.fn().mockResolvedValue(findFirstResult);
  const prisma = {
    housingApplicationDocument: { updateMany, findFirst },
  } as never;
  return { prisma, updateMany };
}

describe("applyDocumentScanResult", () => {
  it("marks a document CLEAN when reported against the clean bucket, and never touches the GCS object", async () => {
    const { prisma } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: cleanBucketName,
      objectKey,
      verdict: "CLEAN",
    });

    expect(outcome).toBe("updated");
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("marks a document INFECTED when reported against the quarantine bucket, and leaves the GCS object and DB rows for the client cancel path", async () => {
    const { prisma } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: quarantineBucketName,
      objectKey,
      verdict: "INFECTED",
    });

    expect(outcome).toBe("updated");
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("is a no-op for a FAILED verdict, since no bucket derives it (out of scope for this webhook)", async () => {
    const { prisma, updateMany } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: quarantineBucketName,
      objectKey,
      verdict: "FAILED",
    });

    expect(outcome).toBe("not_found");
    expect(updateMany).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("is idempotent for a duplicate INFECTED delivery (already resolved)", async () => {
    const { prisma } = prismaWith(0, { id: "doc-1" });

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: quarantineBucketName,
      objectKey,
      verdict: "INFECTED",
    });

    expect(outcome).toBe("already_resolved");
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("is idempotent for a second CLEAN delivery on the same objectKey (post-extraction re-scan of the compressed PDF)", async () => {
    // vertex.fromDocument.extractor.ts re-uploads the ordered/compressed PDF
    // through the unscanned bucket, so ClamAV fires a second CLEAN finalize
    // for an objectKey whose row is already CLEAN — this must be a no-op.
    const { prisma } = prismaWith(0, { id: "doc-1" });

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: cleanBucketName,
      objectKey,
      verdict: "CLEAN",
    });

    expect(outcome).toBe("already_resolved");
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("is a no-op when no document matches the reported objectKey", async () => {
    const { prisma } = prismaWith(0, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: quarantineBucketName,
      objectKey,
      verdict: "INFECTED",
    });

    expect(outcome).toBe("not_found");
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("is a no-op for a CLEAN verdict reported against the quarantine bucket, without querying the database", async () => {
    const { prisma, updateMany } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: quarantineBucketName,
      objectKey,
      verdict: "CLEAN",
    });

    expect(outcome).toBe("not_found");
    expect(updateMany).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("is a no-op for an INFECTED verdict reported against the clean bucket, without querying the database", async () => {
    const { prisma, updateMany } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: cleanBucketName,
      objectKey,
      verdict: "INFECTED",
    });

    expect(outcome).toBe("not_found");
    expect(updateMany).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("is a no-op for an INFECTED verdict reported against the plain upload bucket", async () => {
    const { prisma, updateMany } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: uploadBucketName,
      objectKey,
      verdict: "INFECTED",
    });

    expect(outcome).toBe("not_found");
    expect(updateMany).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("is a no-op for a bucket that is neither the quarantine nor the clean bucket", async () => {
    const { prisma, updateMany } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: "some-other-bucket",
      objectKey,
      verdict: "CLEAN",
    });

    expect(outcome).toBe("not_found");
    expect(updateMany).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });
});

describe("deriveVerdictFromBucket", () => {
  it("returns CLEAN for the clean bucket", () => {
    expect(deriveVerdictFromBucket(cleanBucketName)).toBe("CLEAN");
  });

  it("returns INFECTED for the quarantine bucket", () => {
    expect(deriveVerdictFromBucket(quarantineBucketName)).toBe("INFECTED");
  });

  it("returns undefined for any other bucket, including the plain upload bucket", () => {
    expect(deriveVerdictFromBucket(uploadBucketName)).toBeUndefined();
    expect(deriveVerdictFromBucket("some-other-bucket")).toBeUndefined();
  });

  describe("while the scan flag is off", () => {
    beforeEach(() => {
      gcsMocks.gcsConfig.malwareScanEnabled = false;
    });

    it("returns undefined for the clean bucket", () => {
      expect(deriveVerdictFromBucket(cleanBucketName)).toBeUndefined();
    });

    it("still returns INFECTED for the quarantine bucket", () => {
      expect(deriveVerdictFromBucket(quarantineBucketName)).toBe("INFECTED");
    });
  });
});

describe("applyDocumentScanResult while the scan flag is off", () => {
  beforeEach(() => {
    gcsMocks.gcsConfig.malwareScanEnabled = false;
  });

  it("rejects a CLEAN verdict as not_found without touching the document", async () => {
    const { prisma, updateMany } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: cleanBucketName,
      objectKey,
      verdict: "CLEAN",
    });

    expect(outcome).toBe("not_found");
    expect(updateMany).not.toHaveBeenCalled();
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
  });

  it("still marks a document INFECTED when reported against the quarantine bucket", async () => {
    const { prisma, updateMany } = prismaWith(1, null);

    const outcome = await applyDocumentScanResult(prisma, {
      bucketName: quarantineBucketName,
      objectKey,
      verdict: "INFECTED",
    });

    expect(outcome).toBe("updated");
    expect(updateMany).toHaveBeenCalledTimes(1);
  });
});

describe("isCleanBucketWithScanDisabled", () => {
  it("is true for the clean bucket while the scan flag is off", () => {
    gcsMocks.gcsConfig.malwareScanEnabled = false;

    expect(isCleanBucketWithScanDisabled(cleanBucketName)).toBe(true);
  });

  it("is false for the clean bucket while the scan flag is on", () => {
    expect(isCleanBucketWithScanDisabled(cleanBucketName)).toBe(false);
  });

  it("is false for any other bucket, whatever the scan flag says", () => {
    gcsMocks.gcsConfig.malwareScanEnabled = false;

    expect(isCleanBucketWithScanDisabled(quarantineBucketName)).toBe(false);
    expect(isCleanBucketWithScanDisabled("some-other-bucket")).toBe(false);
  });
});
