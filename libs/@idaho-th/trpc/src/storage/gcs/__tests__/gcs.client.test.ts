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

// This suite imports its subject dynamically (after the mocks above), so it has
// no static import to mark it as a module — without this the top-level consts
// would land in the shared global scope of the spec typecheck.
export {};

const sdk = vi.hoisted(() => ({
  storageArgs: [] as unknown[],
  googleAuthArgs: [] as unknown[],
  impersonatedArgs: [] as unknown[],
  sourceClient: { id: "source-client" },
  /** Set to make the impersonation source auth fail on the next attempt. */
  getClientError: undefined as Error | undefined,
}));

// Plain classes rather than vi.fn: the config-level mockReset empties a mocked
// constructor's implementation between tests.
vi.mock("@google-cloud/storage", () => ({
  Storage: class {
    constructor(options: unknown) {
      sdk.storageArgs.push(options);
    }
  },
}));

vi.mock("google-auth-library", () => ({
  AuthClient: class {},
  GoogleAuth: class {
    constructor(options: unknown) {
      sdk.googleAuthArgs.push(options);
    }
    async getClient() {
      if (sdk.getClientError) throw sdk.getClientError;
      return sdk.sourceClient;
    }
  },
  Impersonated: class {
    constructor(options: unknown) {
      sdk.impersonatedArgs.push(options);
    }
  },
}));

const config = vi.hoisted(() => ({
  gcsConfig: {
    projectId: "test-project",
    dedicatedKeyFilename: undefined as string | undefined,
    impersonateTarget: undefined as string | undefined,
    impersonationSourceKeyFilename: undefined as string | undefined,
  },
  GCS_IMPERSONATION_SOURCE_SCOPES: ["source-scope"] as const,
  GCS_IMPERSONATION_TARGET_SCOPES: ["target-scope"] as const,
  GCS_IMPERSONATION_TOKEN_LIFETIME_SECONDS: 3600,
}));

vi.mock("~@idaho-th/trpc/storage/gcs/gcs.config", () => config);

/** Fresh module registry per test: the client memoizes its Storage singleton. */
async function loadClient() {
  vi.resetModules();
  return import("../gcs.client");
}

beforeEach(() => {
  sdk.storageArgs.length = 0;
  sdk.googleAuthArgs.length = 0;
  sdk.impersonatedArgs.length = 0;
  sdk.getClientError = undefined;
  config.gcsConfig.dedicatedKeyFilename = undefined;
  config.gcsConfig.impersonateTarget = undefined;
  config.gcsConfig.impersonationSourceKeyFilename = undefined;
});

describe("getGcsStorageClient", () => {
  test("refuses to hand out a client before initialization", async () => {
    const { getGcsStorageClient } = await loadClient();

    expect(() => getGcsStorageClient()).toThrow(
      /not initialized.*ensureGcsStorageInitialized/s,
    );
  });

  test("returns the same client on every call after initialization", async () => {
    const { ensureGcsStorageInitialized, getGcsStorageClient } =
      await loadClient();

    await ensureGcsStorageInitialized();

    expect(getGcsStorageClient()).toBe(getGcsStorageClient());
    expect(sdk.storageArgs).toHaveLength(1);
  });

  test("builds the client only once across repeated initialization", async () => {
    const { ensureGcsStorageInitialized } = await loadClient();

    await ensureGcsStorageInitialized();
    await ensureGcsStorageInitialized();

    expect(sdk.storageArgs).toHaveLength(1);
  });
});

describe("credential selection", () => {
  test("prefers a dedicated key file and never reaches impersonation", async () => {
    config.gcsConfig.dedicatedKeyFilename = "/keys/gcs.json";
    config.gcsConfig.impersonateTarget = "sa@project.iam.gserviceaccount.com";
    const { ensureGcsStorageInitialized } = await loadClient();

    await ensureGcsStorageInitialized();

    expect(sdk.storageArgs).toEqual([
      { projectId: "test-project", keyFilename: "/keys/gcs.json" },
    ]);
    expect(sdk.impersonatedArgs).toHaveLength(0);
  });

  test("impersonates the configured target when no dedicated key exists", async () => {
    config.gcsConfig.impersonateTarget = "sa@project.iam.gserviceaccount.com";
    config.gcsConfig.impersonationSourceKeyFilename = "/keys/source.json";
    const { ensureGcsStorageInitialized } = await loadClient();

    await ensureGcsStorageInitialized();

    expect(sdk.googleAuthArgs).toEqual([
      { keyFilename: "/keys/source.json", scopes: ["source-scope"] },
    ]);
    expect(sdk.impersonatedArgs).toEqual([
      {
        sourceClient: sdk.sourceClient,
        targetPrincipal: "sa@project.iam.gserviceaccount.com",
        delegates: [],
        targetScopes: ["target-scope"],
        lifetime: 3600,
      },
    ]);
    expect(sdk.storageArgs[0]).toMatchObject({ projectId: "test-project" });
  });

  test("omits keyFilename from the source auth when none is configured", async () => {
    config.gcsConfig.impersonateTarget = "sa@project.iam.gserviceaccount.com";
    const { ensureGcsStorageInitialized } = await loadClient();

    await ensureGcsStorageInitialized();

    expect(sdk.googleAuthArgs).toEqual([{ scopes: ["source-scope"] }]);
  });

  test("falls back to application default credentials", async () => {
    const { ensureGcsStorageInitialized } = await loadClient();

    await ensureGcsStorageInitialized();

    expect(sdk.storageArgs).toEqual([{ projectId: "test-project" }]);
    expect(sdk.googleAuthArgs).toHaveLength(0);
  });
});

describe("initialization failure", () => {
  test("rethrows and leaves a later attempt able to succeed", async () => {
    config.gcsConfig.impersonateTarget = "sa@project.iam.gserviceaccount.com";
    const { ensureGcsStorageInitialized, getGcsStorageClient } =
      await loadClient();

    const failure = new Error("impersonation denied");
    sdk.getClientError = failure;

    await expect(ensureGcsStorageInitialized()).rejects.toBe(failure);
    expect(() => getGcsStorageClient()).toThrow(/not initialized/);

    // The failed attempt must clear the in-flight promise, or every later
    // request would keep awaiting the same rejection.
    sdk.getClientError = undefined;
    await expect(ensureGcsStorageInitialized()).resolves.toBeUndefined();
    expect(getGcsStorageClient()).toBeDefined();
  });
});
