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

import {
  GCS_ACTION_READ,
  GCS_ACTION_RESUMABLE,
  GCS_ACTION_WRITE,
  GCS_SIGNED_READ_EXPIRY_MS,
  GCS_SIGNED_URL_VERSION,
  GCS_SIGNED_WRITE_EXPIRY_MS,
} from "~@idaho-th/trpc/storage/gcs/gcs.constants";
import { classifyTrpcError, ERROR_KIND } from "~observability";

import type { FakeGcsStorage } from "./gcs.fake";
import { createFakeGcsStorage, DEFAULT_SIGNED_URL } from "./gcs.fake";

const holder = vi.hoisted(() => ({ current: null as unknown }));

// Plain class, not vi.fn: the config-level mockReset would empty a mocked
// constructor's implementation between tests.
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
const {
  generateResumableUploadUrl,
  generateSignedReadUrl,
  generateSignedUrl,
  signingFailureTrpcError,
} = await import("~@idaho-th/trpc/storage/gcs/signedUrl.service");

const BUCKET = "test-pdf-bucket";
const OBJECT_KEY = "applications/app-1/upload.pdf";
const NOW = 1_700_000_000_000;

let fake: FakeGcsStorage;

beforeEach(async () => {
  fake = createFakeGcsStorage();
  holder.current = fake;
  await ensureGcsStorageInitialized();
});

afterEach(() => {
  vi.useRealTimers();
});

/** The config the service handed to the SDK for a single signing call. */
async function signedUrlConfigFor(
  input: Parameters<typeof generateSignedUrl>[0],
) {
  await generateSignedUrl(input);
  const file = fake.file(input.bucketName, input.objectKey);
  expect(file.getSignedUrl).toHaveBeenCalledTimes(1);
  return file.getSignedUrl.mock.calls[0]?.[0];
}

describe("buildSignedUrlConfig action mapping", () => {
  test.each([
    ["write", GCS_ACTION_WRITE],
    ["resumable", GCS_ACTION_RESUMABLE],
    ["read", GCS_ACTION_READ],
    // An unknown action must degrade to the least-privileged one.
    ["something-else", GCS_ACTION_READ],
  ])("%s maps to %s", async (action, expected) => {
    const config = await signedUrlConfigFor({
      bucketName: BUCKET,
      objectKey: OBJECT_KEY,
      action: action as "read",
    });

    expect(config.action).toBe(expected);
    expect(config.version).toBe(GCS_SIGNED_URL_VERSION);
  });
});

describe("buildSignedUrlConfig expiry", () => {
  test.each([
    ["write", GCS_SIGNED_WRITE_EXPIRY_MS],
    ["resumable", GCS_SIGNED_WRITE_EXPIRY_MS],
    ["read", GCS_SIGNED_READ_EXPIRY_MS],
  ])("%s expires after its own default", async (action, expectedMs) => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const config = await signedUrlConfigFor({
      bucketName: BUCKET,
      objectKey: OBJECT_KEY,
      action: action as "read",
    });

    expect(config.expires).toBe(NOW + expectedMs);
  });

  test("an explicit expiresMs overrides both defaults", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    for (const action of ["read", "write"] as const) {
      const objectKey = `${OBJECT_KEY}.${action}`;
      // eslint-disable-next-line no-await-in-loop -- one signing call at a time
      const config = await signedUrlConfigFor({
        bucketName: BUCKET,
        objectKey,
        action,
        expiresMs: 1_000,
      });

      expect(config.expires).toBe(NOW + 1_000);
    }
  });
});

describe("buildSignedUrlConfig scope narrowing", () => {
  test.each(["write", "resumable"] as const)(
    "%s carries contentType but never responseDisposition",
    async (action) => {
      const config = await signedUrlConfigFor({
        bucketName: BUCKET,
        objectKey: OBJECT_KEY,
        action,
        contentType: "application/pdf",
        responseDisposition: "attachment",
      });

      expect(config.contentType).toBe("application/pdf");
      expect(config).not.toHaveProperty("responseDisposition");
    },
  );

  test("read carries responseDisposition but never contentType", async () => {
    const config = await signedUrlConfigFor({
      bucketName: BUCKET,
      objectKey: OBJECT_KEY,
      action: "read",
      contentType: "application/pdf",
      responseDisposition: "attachment",
    });

    expect(config.responseDisposition).toBe("attachment");
    // A read URL that also grants a content type would widen its own scope.
    expect(config).not.toHaveProperty("contentType");
  });

  test("omits both keys when neither is supplied", async () => {
    const config = await signedUrlConfigFor({
      bucketName: BUCKET,
      objectKey: OBJECT_KEY,
      action: "write",
    });

    expect(config).not.toHaveProperty("contentType");
    expect(config).not.toHaveProperty("responseDisposition");
  });
});

describe("signed URL helpers", () => {
  test("generateSignedReadUrl signs a read and returns the URL", async () => {
    await expect(
      generateSignedReadUrl({ bucketName: BUCKET, objectKey: OBJECT_KEY }),
    ).resolves.toBe(DEFAULT_SIGNED_URL);

    expect(
      fake.file(BUCKET, OBJECT_KEY).getSignedUrl.mock.calls[0]?.[0].action,
    ).toBe(GCS_ACTION_READ);
  });

  test("generateResumableUploadUrl signs a resumable upload", async () => {
    await expect(
      generateResumableUploadUrl({ bucketName: BUCKET, objectKey: OBJECT_KEY }),
    ).resolves.toBe(DEFAULT_SIGNED_URL);

    expect(
      fake.file(BUCKET, OBJECT_KEY).getSignedUrl.mock.calls[0]?.[0].action,
    ).toBe(GCS_ACTION_RESUMABLE);
  });
});

describe("signingFailureTrpcError", () => {
  test("returns a generic PRECONDITION_FAILED and preserves an Error cause", () => {
    const cause = new Error("no client_email in credentials");
    const error = signingFailureTrpcError(cause);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("PRECONDITION_FAILED");
    expect(error.message).toBe("Unable to generate a download link");
    expect(error.cause).toBe(cause);
  });

  test("is classified as a server fault so it still reaches Sentry", () => {
    const error = signingFailureTrpcError(new Error("signing blew up"));

    expect(classifyTrpcError(error)).toEqual({
      kind: ERROR_KIND.UNEXPECTED,
      code: "PRECONDITION_FAILED",
      httpStatus: 412,
    });
  });

  test("drops a non-Error cause instead of attaching it", () => {
    expect(signingFailureTrpcError("plain string").cause).toBeUndefined();
  });

  test("keeps the remediation guidance out of the thrown message", () => {
    const error = signingFailureTrpcError(new Error("signing blew up"));

    // The remediation names service accounts and gcloud commands; it belongs in
    // the server log, never in a client-visible message.
    expect(error.message).not.toMatch(
      /gcloud|service account|GOOGLE_APPLICATION_CREDENTIALS/i,
    );
    expect(JSON.stringify(error)).not.toContain("gcloud");

    expect(loggerMocks.error).toHaveBeenCalledWith(
      "GCS signed URL generation failed",
      expect.objectContaining({
        error: "signing blew up",
        remediation: expect.stringContaining(
          "gcloud auth application-default login",
        ),
      }),
    );
  });
});
