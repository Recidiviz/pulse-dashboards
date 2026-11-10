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

import { TRPCError } from "@trpc/server";

import { MAX_INLINE_READ_BYTES } from "~@idaho-th/trpc/storage/gcs/gcs.constants";

import type { FakeGcsStorage } from "./gcs.fake";
import { createFakeGcsStorage, DEFAULT_SIGNED_URL } from "./gcs.fake";

const holder = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@google-cloud/storage", () => ({
  Storage: class {
    bucket(bucketName: string) {
      return (holder.current as FakeGcsStorage).bucket(bucketName);
    }
  },
}));

const loggerMocks = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/common/logger", () => ({
  getLogger: () => loggerMocks,
}));

const { ensureGcsStorageInitialized } = await import(
  "~@idaho-th/trpc/storage/gcs/gcs.client"
);
const { gcsConfig } = await import("~@idaho-th/trpc/storage/gcs/gcs.config");
const { downloadGcsObjectAsBase64, resolveGcsReadAccess } = await import(
  "~@idaho-th/trpc/storage/gcs/readAccess.service"
);

const BUCKET = "test-pdf-bucket";
const OBJECT_KEY = "applications/app-1/upload.pdf";
const REF = { bucketName: BUCKET, objectKey: OBJECT_KEY };

/** Only a signing error whose message names client_email may inline a body. */
const CREDENTIAL_ERROR = new Error("Cannot sign data without `client_email`.");

const originalIsProduction = gcsConfig.isProduction;

let fake: FakeGcsStorage;

beforeEach(async () => {
  fake = createFakeGcsStorage();
  holder.current = fake;
  await ensureGcsStorageInitialized();
});

afterEach(() => {
  gcsConfig.isProduction = originalIsProduction;
});

function failSigningWith(error: unknown) {
  fake.file(BUCKET, OBJECT_KEY).getSignedUrl.mockRejectedValue(error);
  return fake.file(BUCKET, OBJECT_KEY);
}

describe("resolveGcsReadAccess", () => {
  test("returns the signed URL and never downloads the body", async () => {
    await expect(resolveGcsReadAccess(REF)).resolves.toEqual({
      signedUrl: DEFAULT_SIGNED_URL,
      contentBase64: null,
    });

    expect(fake.file(BUCKET, OBJECT_KEY).download).not.toHaveBeenCalled();
  });

  test("production never inlines a file body", async () => {
    gcsConfig.isProduction = true;
    const file = failSigningWith(CREDENTIAL_ERROR);

    await expect(resolveGcsReadAccess(REF)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(file.download).not.toHaveBeenCalled();
  });

  test("honours devInlineReadFallback: false outside production", async () => {
    gcsConfig.isProduction = false;
    const file = failSigningWith(CREDENTIAL_ERROR);

    await expect(
      resolveGcsReadAccess(REF, { devInlineReadFallback: false }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(file.download).not.toHaveBeenCalled();
  });

  test("rethrows a signing error that is not credential-shaped", async () => {
    gcsConfig.isProduction = false;
    const unrelated = new Error("bucket does not exist");
    const file = failSigningWith(unrelated);

    // Same instance, not wrapped: only the credential case earns the fallback.
    await expect(resolveGcsReadAccess(REF)).rejects.toBe(unrelated);
    expect(file.download).not.toHaveBeenCalled();
  });

  test("rethrows a non-Error rejection unchanged", async () => {
    gcsConfig.isProduction = false;
    failSigningWith("signing unavailable");

    await expect(resolveGcsReadAccess(REF)).rejects.toBe("signing unavailable");
  });

  test("inlines base64 for a credential error outside production", async () => {
    gcsConfig.isProduction = false;
    const file = failSigningWith(CREDENTIAL_ERROR);
    file.download.mockResolvedValue([Buffer.from("inline-bytes")]);

    await expect(resolveGcsReadAccess(REF)).resolves.toEqual({
      signedUrl: null,
      contentBase64: Buffer.from("inline-bytes").toString("base64"),
    });
  });

  test("uses supplied metadata instead of fetching it during the fallback", async () => {
    gcsConfig.isProduction = false;
    const file = failSigningWith(CREDENTIAL_ERROR);

    await resolveGcsReadAccess(REF, { fileMetadata: { size: "10" } });

    expect(file.getMetadata).not.toHaveBeenCalled();
  });

  test("refuses to inline an object above the limit", async () => {
    gcsConfig.isProduction = false;
    const file = failSigningWith(CREDENTIAL_ERROR);

    await expect(
      resolveGcsReadAccess(REF, {
        fileMetadata: { size: String(MAX_INLINE_READ_BYTES + 1) },
      }),
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(file.download).not.toHaveBeenCalled();
  });
});

describe("downloadGcsObjectAsBase64", () => {
  test("uses supplied metadata without a metadata fetch", async () => {
    const file = fake.file(BUCKET, OBJECT_KEY);
    file.download.mockResolvedValue([Buffer.from("abc")]);

    await expect(downloadGcsObjectAsBase64(REF, { size: "3" })).resolves.toBe(
      Buffer.from("abc").toString("base64"),
    );
    expect(file.getMetadata).not.toHaveBeenCalled();
  });

  test("fetches metadata when none is supplied", async () => {
    const file = fake.file(BUCKET, OBJECT_KEY);
    file.getMetadata.mockResolvedValue([{ size: "3" }]);

    await downloadGcsObjectAsBase64(REF);

    expect(file.getMetadata).toHaveBeenCalledTimes(1);
  });

  test("throws PAYLOAD_TOO_LARGE above the limit and passes at exactly the limit", async () => {
    const file = fake.file(BUCKET, OBJECT_KEY);

    await expect(
      downloadGcsObjectAsBase64(REF, {
        size: String(MAX_INLINE_READ_BYTES + 1),
      }),
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(file.download).not.toHaveBeenCalled();

    await expect(
      downloadGcsObjectAsBase64(REF, { size: String(MAX_INLINE_READ_BYTES) }),
    ).resolves.toBeTypeOf("string");
  });

  test.each([
    ["absent", {}],
    ["NaN", { size: "NaN" }],
    ["non-numeric", { size: "not-a-number" }],
  ])("allows the download when size is %s", async (_label, metadata) => {
    // Number.isFinite guards the comparison, so an unparseable size must not
    // be treated as over the limit.
    await expect(downloadGcsObjectAsBase64(REF, metadata)).resolves.toBeTypeOf(
      "string",
    );
  });
});
