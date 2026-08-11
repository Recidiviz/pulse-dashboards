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

import { Errors } from "typesense";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { isOfflineMode } from "../../utils/isOfflineMode";
import {
  ensureSearchOnlyParentKey,
  initTypesenseScopedKeys,
  OFFLINE_PARENT_KEY,
} from "../typesense/init";

vi.mock("../../utils/isOfflineMode");

const mockCreateKey = vi.fn();

vi.mock("~@typesense/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@typesense/client")>();
  return {
    ...actual,
    createLocalTypesenseClient: () => ({
      keys: () => ({ create: mockCreateKey }),
    }),
  };
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(isOfflineMode).mockReturnValue(true);
  delete process.env["TYPESENSE_API_SEARCH_KEY"];
  // Failing the warm-up leaves the module memo empty — each test starts clean.
  mockCreateKey.mockRejectedValue(new Error("reset"));
  await expect(initTypesenseScopedKeys()).rejects.toThrow();
  mockCreateKey.mockReset();
});

describe("ensureSearchOnlyParentKey", () => {
  test("provisions the offline parent key at its pinned value", async () => {
    mockCreateKey.mockResolvedValue({ value: OFFLINE_PARENT_KEY });

    await expect(ensureSearchOnlyParentKey()).resolves.toBe(OFFLINE_PARENT_KEY);
    expect(mockCreateKey).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: ["documents:search"],
        collections: ["*"],
        value: OFFLINE_PARENT_KEY,
      }),
    );
  });

  test("reuses the existing key when Typesense reports a conflict", async () => {
    mockCreateKey.mockRejectedValue(
      new Errors.ObjectAlreadyExists("API key generation conflict."),
    );

    await expect(ensureSearchOnlyParentKey()).resolves.toBe(OFFLINE_PARENT_KEY);
  });

  test("memoizes, so a second caller doesn't re-provision", async () => {
    mockCreateKey.mockResolvedValue({ value: OFFLINE_PARENT_KEY });

    await ensureSearchOnlyParentKey();
    await ensureSearchOnlyParentKey();

    expect(mockCreateKey).toHaveBeenCalledTimes(1);
  });

  test("concurrent callers share one in-flight resolution", async () => {
    mockCreateKey.mockResolvedValue({ value: OFFLINE_PARENT_KEY });

    await expect(
      Promise.all([ensureSearchOnlyParentKey(), ensureSearchOnlyParentKey()]),
    ).resolves.toEqual([OFFLINE_PARENT_KEY, OFFLINE_PARENT_KEY]);

    expect(mockCreateKey).toHaveBeenCalledTimes(1);
  });

  // The offline race this guards: the server boots while Typesense is still
  // starting, so the boot-time warm-up fails.
  test("retries after a failure instead of caching the rejection", async () => {
    mockCreateKey.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));
    await expect(initTypesenseScopedKeys()).rejects.toThrow(
      "connect ECONNREFUSED",
    );

    mockCreateKey.mockResolvedValue({ value: OFFLINE_PARENT_KEY });
    await expect(ensureSearchOnlyParentKey()).resolves.toBe(OFFLINE_PARENT_KEY);
  });

  test("propagates non-conflict provisioning errors", async () => {
    mockCreateKey.mockRejectedValue(
      new Errors.RequestUnauthorized("Forbidden - a valid API key is required"),
    );
    await expect(initTypesenseScopedKeys()).rejects.toThrow(
      "a valid API key is required",
    );
  });

  test("uses TYPESENSE_API_SEARCH_KEY when not offline", async () => {
    vi.mocked(isOfflineMode).mockReturnValue(false);
    process.env["TYPESENSE_API_SEARCH_KEY"] = "env-parent-key";
    mockCreateKey.mockClear();

    await initTypesenseScopedKeys();

    await expect(ensureSearchOnlyParentKey()).resolves.toBe("env-parent-key");
    expect(mockCreateKey).not.toHaveBeenCalled();
  });

  test("throws when not offline and TYPESENSE_API_SEARCH_KEY is unset", async () => {
    vi.mocked(isOfflineMode).mockReturnValue(false);
    await expect(initTypesenseScopedKeys()).rejects.toThrow(
      "TYPESENSE_API_SEARCH_KEY is not set",
    );
  });
});
