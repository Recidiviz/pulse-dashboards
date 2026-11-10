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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV = {
  GOOGLE_PROJECT_ID: "test-project",
  IDAHO_TH_PDF_GCS_BUCKET: "idaho-th-uploads",
};

const originalEnv = { ...process.env };

async function loadGcsModule() {
  return import("../gcs.config");
}

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv, ...REQUIRED_ENV };
  delete process.env["IDAHO_TH_PDF_GCS_CLEAN_BUCKET"];
  delete process.env["IDAHO_TH_SKIP_DOCUMENT_SCAN"];
  delete process.env["IDAHO_TH_MALWARE_SCAN_ENABLED"];
  delete process.env["NODE_ENV"];
});

afterEach(() => {
  process.env = originalEnv;
});

describe("gcsConfig", () => {
  it("loads fine with collapsed buckets when malware scanning is not enabled (Phase A)", async () => {
    process.env["NODE_ENV"] = "production";

    const { gcsConfig } = await loadGcsModule();

    expect(gcsConfig.cleanBucketName).toBe(gcsConfig.bucketName);
    expect(gcsConfig.malwareScanEnabled).toBe(false);
  });

  it("loads fine when a distinct clean bucket is configured", async () => {
    process.env["NODE_ENV"] = "production";
    process.env["IDAHO_TH_PDF_GCS_CLEAN_BUCKET"] = "idaho-th-clean";
    process.env["IDAHO_TH_MALWARE_SCAN_ENABLED"] = "true";

    const { gcsConfig } = await loadGcsModule();

    expect(gcsConfig.cleanBucketName).toBe("idaho-th-clean");
    expect(gcsConfig.bucketName).toBe("idaho-th-uploads");
  });

  it("allows the bucket collapse in skipDocumentScan dev mode even with scanning enabled", async () => {
    process.env["NODE_ENV"] = "development";
    process.env["IDAHO_TH_SKIP_DOCUMENT_SCAN"] = "true";
    process.env["IDAHO_TH_MALWARE_SCAN_ENABLED"] = "true";

    const { gcsConfig, assertScanPipelineConfigured } = await loadGcsModule();

    expect(gcsConfig.cleanBucketName).toBe(gcsConfig.bucketName);
    expect(gcsConfig.skipDocumentScan).toBe(true);
    expect(() => assertScanPipelineConfigured()).not.toThrow();
  });
});

describe("assertScanPipelineConfigured", () => {
  it("does not throw when malware scanning is disabled and buckets collapse", async () => {
    process.env["NODE_ENV"] = "production";

    const { assertScanPipelineConfigured } = await loadGcsModule();

    expect(() => assertScanPipelineConfigured()).not.toThrow();
  });

  it("throws at request time when scanning is enabled but buckets collapse", async () => {
    process.env["NODE_ENV"] = "production";
    process.env["IDAHO_TH_MALWARE_SCAN_ENABLED"] = "true";

    const { assertScanPipelineConfigured } = await loadGcsModule();

    expect(() => assertScanPipelineConfigured()).toThrow(
      /must be set to a bucket distinct from/,
    );
  });

  it("does not throw when scanning is enabled and buckets are distinct", async () => {
    process.env["NODE_ENV"] = "production";
    process.env["IDAHO_TH_MALWARE_SCAN_ENABLED"] = "true";
    process.env["IDAHO_TH_PDF_GCS_CLEAN_BUCKET"] = "idaho-th-clean";

    const { assertScanPipelineConfigured } = await loadGcsModule();

    expect(() => assertScanPipelineConfigured()).not.toThrow();
  });
});

describe("resolveUnscannedUploadBucketName", () => {
  it("returns the upload bucket, which is where an unscanned object lands", async () => {
    process.env["IDAHO_TH_PDF_GCS_CLEAN_BUCKET"] = "idaho-th-clean";

    const { gcsConfig, resolveUnscannedUploadBucketName } =
      await loadGcsModule();

    expect(resolveUnscannedUploadBucketName()).toBe("idaho-th-uploads");
    expect(resolveUnscannedUploadBucketName()).not.toBe(
      gcsConfig.cleanBucketName,
    );
  });
});
