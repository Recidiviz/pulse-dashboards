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

import { Firestore } from "@google-cloud/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { waitForFirestoreEmulator } from "../emulator/helpers";

/**
 * A Firestore stand-in whose `listCollections` replies differently on each
 * call, so a test can express "reachable, then eventually populated".
 */
function fakeDb(replies: Array<Error | number>): Firestore {
  let call = 0;
  return {
    listCollections: vi.fn(async () => {
      const reply = replies[Math.min(call++, replies.length - 1)];
      if (reply instanceof Error) throw reply;
      return new Array(reply).fill({});
    }),
  } as unknown as Firestore;
}

describe("waitForFirestoreEmulator", () => {
  beforeEach(() => {
    // The wait sleeps between attempts. `settle` drives the clock, so a test
    // that exhausts every attempt costs no wall-clock.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Runs `promise` to completion, advancing the fake clock past every sleep. */
  async function settle<T>(promise: Promise<T>): Promise<T> {
    const settled = promise.then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    await vi.runAllTimersAsync();
    const outcome = await settled;
    if (!outcome.ok) throw outcome.error;
    return outcome.value;
  }

  it("returns once collections are present", async () => {
    const db = fakeDb([2]);

    await expect(settle(waitForFirestoreEmulator(db))).resolves.toBeUndefined();
    expect(db.listCollections).toHaveBeenCalledTimes(1);
  });

  it("keeps waiting while the emulator replies but reports nothing", async () => {
    // THE regression: returning on the first successful reply sends the derived
    // importers against a database that is still importing.
    const db = fakeDb([0, 0, 3]);

    await settle(waitForFirestoreEmulator(db));

    expect(db.listCollections).toHaveBeenCalledTimes(3);
  });

  it("keeps waiting while the emulator is unreachable", async () => {
    const db = fakeDb([new Error("ECONNREFUSED"), new Error("nope"), 1]);

    await settle(waitForFirestoreEmulator(db));

    expect(db.listCollections).toHaveBeenCalledTimes(3);
  });

  it("throws when the emulator never becomes reachable", async () => {
    const db = fakeDb([new Error("ECONNREFUSED")]);

    await expect(settle(waitForFirestoreEmulator(db))).rejects.toThrow(
      /reachable/,
    );
  });

  it("proceeds, with a warning, when the emulator is genuinely empty", async () => {
    // An empty emulator is legitimate, so this must not fail — but it must say
    // so, because the other reading is that the import never finished.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const db = fakeDb([0]);

    await expect(settle(waitForFirestoreEmulator(db))).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("reports no collections"),
    );

    warn.mockRestore();
  });
});
