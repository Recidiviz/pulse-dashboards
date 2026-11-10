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

import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyGcsScanWebhookTokenMock = vi.hoisted(() => vi.fn());
const applyDocumentScanResultMock = vi.hoisted(() => vi.fn());
const deriveVerdictFromBucketMock = vi.hoisted(() => vi.fn());
const isCleanBucketWithScanDisabledMock = vi.hoisted(() => vi.fn());
const getPrismaClientForStateCodeMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/auth/verifyGcsScanWebhookToken", () => ({
  verifyGcsScanWebhookToken: verifyGcsScanWebhookTokenMock,
}));

vi.mock("~@idaho-th/trpc/routes/documents/documents.service", () => ({
  applyDocumentScanResult: applyDocumentScanResultMock,
  deriveVerdictFromBucket: deriveVerdictFromBucketMock,
  isCleanBucketWithScanDisabled: isCleanBucketWithScanDisabledMock,
}));
vi.mock("~@idaho-th/prisma", () => ({
  getPrismaClientForStateCode: getPrismaClientForStateCodeMock,
}));

import { registerGcsObjectScannedRoute } from "~@idaho-th/server/routes/internal/gcsObjectScanned";

const audienceUrl = "https://example.com/internal/gcs-object-scanned";
const invokerEmail = "scanner@test.iam.gserviceaccount.com";

const validBody = {
  bucketName: "test-bucket",
  objectKey: "applications/app-1/documents/doc-1.pdf",
  verdict: "CLEAN" as const,
};

const prismaClient = { housingApplicationDocument: {} };

beforeEach(() => {
  vi.clearAllMocks();
  process.env["IDAHO_TH_SCAN_WEBHOOK_AUDIENCE_URL"] = audienceUrl;
  process.env["IDAHO_TH_SCAN_WEBHOOK_INVOKER_EMAIL"] = invokerEmail;
  verifyGcsScanWebhookTokenMock.mockResolvedValue({ valid: true });
  applyDocumentScanResultMock.mockResolvedValue("updated");
  isCleanBucketWithScanDisabledMock.mockReturnValue(false);
  getPrismaClientForStateCodeMock.mockReturnValue(prismaClient);
});

afterEach(() => {
  delete process.env["IDAHO_TH_SCAN_WEBHOOK_AUDIENCE_URL"];
  delete process.env["IDAHO_TH_SCAN_WEBHOOK_INVOKER_EMAIL"];
});

async function buildTestServer() {
  const server = Fastify({ logger: false });
  registerGcsObjectScannedRoute(server);
  await server.ready();
  return server;
}

describe("POST /internal/gcs-object-scanned", () => {
  it("returns 401 when OIDC verification fails", async () => {
    verifyGcsScanWebhookTokenMock.mockResolvedValue({
      valid: false,
      reason: "missing_token",
    });
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      payload: validBody,
    });

    expect(response.statusCode).toBe(401);
    expect(verifyGcsScanWebhookTokenMock).toHaveBeenCalledWith({
      authorizationHeader: undefined,
      audience: audienceUrl,
      expectedInvokerEmail: invokerEmail,
    });
    expect(applyDocumentScanResultMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid body", async () => {
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: { authorization: "Bearer token" },
      payload: { bucketName: "", objectKey: "doc.pdf", verdict: "CLEAN" },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Invalid request body",
    });
    expect(applyDocumentScanResultMock).not.toHaveBeenCalled();
  });

  it("returns 200 when a scan result is applied", async () => {
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: { authorization: "Bearer token" },
      payload: validBody,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
    expect(applyDocumentScanResultMock).toHaveBeenCalledWith(
      prismaClient,
      validBody,
    );
  });

  it("returns 200 for an idempotent duplicate delivery", async () => {
    applyDocumentScanResultMock.mockResolvedValue("already_resolved");
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: { authorization: "Bearer token" },
      payload: validBody,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true });
  });

  it("returns 200 (ignored) when no document matches — ACK so Eventarc does not retry", async () => {
    applyDocumentScanResultMock.mockResolvedValue("not_found");
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: { authorization: "Bearer token" },
      payload: validBody,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      success: true,
      ignored: true,
    });
  });

  it("returns 500 when applying the scan result throws", async () => {
    applyDocumentScanResultMock.mockRejectedValue(new Error("db down"));
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: { authorization: "Bearer token" },
      payload: validBody,
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "An unexpected error occurred",
    });
  });

  it("translates a structured-mode CloudEvent (Eventarc) into a scan result and derives the verdict from the bucket", async () => {
    deriveVerdictFromBucketMock.mockReturnValue("CLEAN");
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: { authorization: "Bearer token" },
      payload: {
        specversion: "1.0",
        type: "google.cloud.storage.object.v1.finalized",
        source: "//storage.googleapis.com/projects/_/buckets/clean-bucket",
        id: "event-1",
        data: {
          bucket: "clean-bucket",
          name: "applications/app-1/documents/doc-1.pdf",
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(deriveVerdictFromBucketMock).toHaveBeenCalledWith("clean-bucket");
    expect(applyDocumentScanResultMock).toHaveBeenCalledWith(prismaClient, {
      bucketName: "clean-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
      verdict: "CLEAN",
    });
  });

  it("translates a binary-mode CloudEvent (ce-* headers, raw StorageObjectData body) into a scan result", async () => {
    deriveVerdictFromBucketMock.mockReturnValue("INFECTED");
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: {
        authorization: "Bearer token",
        "ce-specversion": "1.0",
        "ce-type": "google.cloud.storage.object.v1.finalized",
        "ce-source":
          "//storage.googleapis.com/projects/_/buckets/quarantine-bucket",
        "ce-id": "event-2",
      },
      payload: {
        bucket: "quarantine-bucket",
        name: "applications/app-1/documents/doc-1.pdf",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(deriveVerdictFromBucketMock).toHaveBeenCalledWith(
      "quarantine-bucket",
    );
    expect(applyDocumentScanResultMock).toHaveBeenCalledWith(prismaClient, {
      bucketName: "quarantine-bucket",
      objectKey: "applications/app-1/documents/doc-1.pdf",
      verdict: "INFECTED",
    });
  });

  it("returns 200 (ignored) for a CloudEvent from a bucket that isn't clean or quarantine", async () => {
    deriveVerdictFromBucketMock.mockReturnValue(undefined);
    const server = await buildTestServer();

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: { authorization: "Bearer token" },
      payload: {
        data: {
          bucket: "unrecognized-bucket",
          name: "applications/app-1/documents/doc-1.pdf",
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      success: true,
      ignored: true,
    });
    expect(applyDocumentScanResultMock).not.toHaveBeenCalled();
  });

  it("accepts legacy GCS object keys that include characters outside the generate-time regex (e.g. =)", async () => {
    deriveVerdictFromBucketMock.mockReturnValue("CLEAN");
    applyDocumentScanResultMock.mockResolvedValue("not_found");
    const server = await buildTestServer();
    const legacyKey =
      "uploads/staff/ZcKheQ4xdVGkghedqMsR4wxsoSU6mAPdLCWU210FdSs=/doc.pdf";

    const response = await server.inject({
      method: "POST",
      url: "/internal/gcs-object-scanned",
      headers: { authorization: "Bearer token" },
      payload: {
        data: {
          bucket: "clean-bucket",
          name: legacyKey,
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      success: true,
      ignored: true,
    });
    expect(applyDocumentScanResultMock).toHaveBeenCalledWith(prismaClient, {
      bucketName: "clean-bucket",
      objectKey: legacyKey,
      verdict: "CLEAN",
    });
  });

  describe("when the malware scan flag is off", () => {
    const objectName = "applications/app-1/documents/doc-1.pdf";

    async function buildServerWithLogSpies() {
      const warn = vi.fn();
      const info = vi.fn();
      const server = Fastify({ logger: false });
      server.addHook("onRequest", async (req) => {
        req.log.warn = warn;
        req.log.info = info;
      });
      registerGcsObjectScannedRoute(server);
      await server.ready();
      return { server, warn, info };
    }

    it("ignores a clean-bucket CloudEvent under the scan-disabled reason", async () => {
      deriveVerdictFromBucketMock.mockReturnValue(undefined);
      isCleanBucketWithScanDisabledMock.mockReturnValue(true);
      const { server, warn } = await buildServerWithLogSpies();

      const response = await server.inject({
        method: "POST",
        url: "/internal/gcs-object-scanned",
        headers: { authorization: "Bearer token" },
        payload: { data: { bucket: "clean-bucket", name: objectName } },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        ignored: true,
      });
      expect(isCleanBucketWithScanDisabledMock).toHaveBeenCalledWith(
        "clean-bucket",
      );
      expect(warn).toHaveBeenCalledWith({
        webhook: "gcs-object-scanned",
        reason: "ignored_malware_scan_disabled",
        bucketName: "clean-bucket",
        objectKey: objectName,
      });
      expect(applyDocumentScanResultMock).not.toHaveBeenCalled();
    });

    it("keeps the unrecognized-bucket reason for a bucket that is neither clean nor quarantine", async () => {
      deriveVerdictFromBucketMock.mockReturnValue(undefined);
      isCleanBucketWithScanDisabledMock.mockReturnValue(false);
      const { server, warn, info } = await buildServerWithLogSpies();

      const response = await server.inject({
        method: "POST",
        url: "/internal/gcs-object-scanned",
        headers: { authorization: "Bearer token" },
        payload: { data: { bucket: "unrecognized-bucket", name: objectName } },
      });

      expect(response.statusCode).toBe(200);
      expect(info).toHaveBeenCalledWith({
        webhook: "gcs-object-scanned",
        reason: "ignored_unrecognized_bucket",
        bucketName: "unrecognized-bucket",
        objectKey: objectName,
      });
      expect(warn).not.toHaveBeenCalled();
      expect(applyDocumentScanResultMock).not.toHaveBeenCalled();
    });

    it("still applies an INFECTED verdict from a quarantine-bucket CloudEvent", async () => {
      deriveVerdictFromBucketMock.mockReturnValue("INFECTED");
      const server = await buildTestServer();

      const response = await server.inject({
        method: "POST",
        url: "/internal/gcs-object-scanned",
        headers: { authorization: "Bearer token" },
        payload: { data: { bucket: "quarantine-bucket", name: objectName } },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ success: true });
      expect(applyDocumentScanResultMock).toHaveBeenCalledWith(prismaClient, {
        bucketName: "quarantine-bucket",
        objectKey: objectName,
        verdict: "INFECTED",
      });
    });

    it("still applies a manual INFECTED body", async () => {
      const server = await buildTestServer();
      const infectedBody = {
        bucketName: "quarantine-bucket",
        objectKey: objectName,
        verdict: "INFECTED" as const,
      };

      const response = await server.inject({
        method: "POST",
        url: "/internal/gcs-object-scanned",
        headers: { authorization: "Bearer token" },
        payload: infectedBody,
      });

      expect(response.statusCode).toBe(200);
      expect(applyDocumentScanResultMock).toHaveBeenCalledWith(
        prismaClient,
        infectedBody,
      );
    });

    it("rejects an unauthenticated request with 401 before looking at the event", async () => {
      verifyGcsScanWebhookTokenMock.mockResolvedValue({
        valid: false,
        reason: "missing_token",
      });
      const server = await buildTestServer();

      const response = await server.inject({
        method: "POST",
        url: "/internal/gcs-object-scanned",
        payload: { data: { bucket: "clean-bucket", name: objectName } },
      });

      expect(response.statusCode).toBe(401);
      expect(deriveVerdictFromBucketMock).not.toHaveBeenCalled();
      expect(applyDocumentScanResultMock).not.toHaveBeenCalled();
    });
  });

  // The webhook is GCP-configured infra that isn't provisioned in every
  // environment. When its env is missing the route must not exist at all —
  // registering it unauthenticated would be worse than having no scan hook.
  describe("when the webhook env is not configured", () => {
    it.each([
      ["the audience URL", "IDAHO_TH_SCAN_WEBHOOK_AUDIENCE_URL"],
      ["the invoker email", "IDAHO_TH_SCAN_WEBHOOK_INVOKER_EMAIL"],
    ])("does not register the route when %s is unset", async (_name, key) => {
      delete process.env[key];
      const warn = vi.fn();
      const server = Fastify({ logger: false });
      server.log.warn = warn;
      registerGcsObjectScannedRoute(server);
      await server.ready();

      const response = await server.inject({
        method: "POST",
        url: "/internal/gcs-object-scanned",
        payload: validBody,
      });

      expect(response.statusCode).toBe(404);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("gcs-object-scanned webhook disabled"),
      );
      expect(verifyGcsScanWebhookTokenMock).not.toHaveBeenCalled();
      expect(applyDocumentScanResultMock).not.toHaveBeenCalled();
    });
  });
});
