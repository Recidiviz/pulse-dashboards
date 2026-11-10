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

import crypto from "crypto";
import { describe, expect, it } from "vitest";

import { computeIntercomUserHash } from "~@idaho-th/trpc/intercom/intercom.messenger";

describe("computeIntercomUserHash", () => {
  it("is the HMAC-SHA256 hex digest of the user id keyed by the secret", () => {
    // Pinned vector: an independent HMAC implementation must agree, so a change
    // to the algorithm (digest, encoding, keying) is caught here.
    expect(computeIntercomUserHash("staff:test-staff", "test-secret")).toBe(
      "76314427c103801ef503189ad1dd06877a182adc2fd1e56f2ff9973c32c7d2ba",
    );
  });

  it("matches a fresh HMAC computed the same way", () => {
    const userId = "provider:7f3c";
    const secret = "another-secret";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(userId, "utf8")
      .digest("hex");

    expect(computeIntercomUserHash(userId, secret)).toBe(expected);
  });

  it("is deterministic for the same inputs", () => {
    expect(computeIntercomUserHash("staff:abc", "secret")).toBe(
      computeIntercomUserHash("staff:abc", "secret"),
    );
  });

  it("produces a 64-character hex string", () => {
    expect(computeIntercomUserHash("staff:abc", "secret")).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  it("changes when the user id changes", () => {
    const secret = "secret";
    expect(computeIntercomUserHash("staff:a", secret)).not.toBe(
      computeIntercomUserHash("staff:b", secret),
    );
  });

  it("changes when the secret changes", () => {
    const userId = "staff:a";
    expect(computeIntercomUserHash(userId, "secret-1")).not.toBe(
      computeIntercomUserHash(userId, "secret-2"),
    );
  });
});
