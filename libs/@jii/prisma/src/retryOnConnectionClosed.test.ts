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

import { PrismaClient } from "./client/client";
import { PrismaClientKnownRequestError } from "./client/internal/prismaNamespace";
import { retryOnConnectionClosed } from "./retryOnConnectionClosed";

/** The shape Prisma gives an extension's `$allModels.$allOperations` hook. */
type OperationHook = (params: {
  operation: string;
  args: unknown;
  query: (args: unknown) => Promise<unknown>;
}) => Promise<unknown>;

/**
 * Using this class mirrors what the real Prisma client throws; the code checks for it
 * to ensure that the error code is actually coming from Prisma.
 */
function connectionClosedError() {
  return new PrismaClientKnownRequestError(
    "Server has closed the connection.",
    {
      code: "P1017",
      clientVersion: "test",
    },
  );
}

/**
 * Captures the `$allModels.$allOperations` hook that {@link retryOnConnectionClosed}
 * installs, so each test can drive it directly to isolate the retry decision for testing.
 */
function getOperationHook(): OperationHook {
  let captured: OperationHook | undefined;

  const fakeClient = {
    $extends: (extension: {
      query: { $allModels: { $allOperations: OperationHook } };
    }) => {
      captured = extension.query.$allModels.$allOperations;
      return {};
    },
  } as unknown as PrismaClient;

  retryOnConnectionClosed(fakeClient);

  if (!captured) throw new Error("no $allOperations hook was installed");
  return captured;
}

let hook: OperationHook;

beforeEach(() => {
  hook = getOperationHook();
});

describe("a read that hits a closed connection", () => {
  test("is retried once, and returns the retry's result", async () => {
    const query = vi
      .fn()
      .mockRejectedValueOnce(connectionClosedError())
      .mockResolvedValueOnce(["resident"]);

    const result = await hook({
      operation: "findMany",
      args: { where: { id: 1 } },
      query,
    });

    expect(result).toEqual(["resident"]);
    expect(query).toHaveBeenCalledTimes(2);
    // the retry must re-send the original args
    expect(query).toHaveBeenNthCalledWith(2, { where: { id: 1 } });
  });

  test("gives up after one retry rather than looping", async () => {
    const query = vi.fn().mockRejectedValue(connectionClosedError());

    await expect(
      hook({ operation: "findUnique", args: {}, query }),
    ).rejects.toThrow("Server has closed the connection.");

    expect(query).toHaveBeenCalledTimes(2);
  });
});

describe("does not retry", () => {
  test.each(["create", "update", "upsert", "delete", "deleteMany"])(
    "%s, because the connection may have dropped after the server committed",
    async (operation) => {
      const query = vi.fn().mockRejectedValue(connectionClosedError());

      await expect(hook({ operation, args: {}, query })).rejects.toThrow(
        "Server has closed the connection.",
      );

      expect(query).toHaveBeenCalledTimes(1);
    },
  );

  test("a read that fails for any other reason", async () => {
    const query = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
      );

    await expect(
      hook({ operation: "findMany", args: {}, query }),
    ).rejects.toThrow("Unique constraint failed");

    expect(query).toHaveBeenCalledTimes(1);
  });

  test("a read that fails with an error carrying no code", async () => {
    const query = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(
      hook({ operation: "findMany", args: {}, query }),
    ).rejects.toThrow("boom");

    expect(query).toHaveBeenCalledTimes(1);
  });
});

test("a successful read is passed straight through", async () => {
  const query = vi.fn().mockResolvedValue(["resident"]);

  const result = await hook({ operation: "findMany", args: {}, query });

  expect(result).toEqual(["resident"]);
  expect(query).toHaveBeenCalledTimes(1);
});
