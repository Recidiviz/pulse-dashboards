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

import { isWebhookSecretValid } from "../verifyWebhookSecret";

const SECRET = "test-webhook-secret";

describe("isWebhookSecretValid", () => {
  test("fails closed when the expected secret is not configured", () => {
    expect(isWebhookSecretValid(undefined, SECRET)).toBe(false);
    expect(isWebhookSecretValid("", SECRET)).toBe(false);
  });

  test("rejects a provided secret that is not a string", () => {
    expect(isWebhookSecretValid(SECRET, undefined)).toBe(false);
    // A repeated header arrives as an array, and a numeric-looking one can be
    // coerced upstream; neither may reach timingSafeEqual.
    expect(isWebhookSecretValid(SECRET, [SECRET] as unknown as string)).toBe(
      false,
    );
    expect(isWebhookSecretValid(SECRET, 1234 as unknown as string)).toBe(false);
  });

  test("rejects a length mismatch instead of throwing", () => {
    // timingSafeEqual raises RangeError on unequal buffer lengths, which would
    // surface as a 500 rather than a 401.
    expect(() => isWebhookSecretValid(SECRET, "short")).not.toThrow();
    expect(isWebhookSecretValid(SECRET, "short")).toBe(false);
    expect(isWebhookSecretValid(SECRET, `${SECRET}x`)).toBe(false);
    expect(isWebhookSecretValid(SECRET, "")).toBe(false);
  });

  test("accepts an exact match", () => {
    expect(isWebhookSecretValid(SECRET, SECRET)).toBe(true);
  });

  test("rejects a same-length near match", () => {
    const nearMatch = `${SECRET.slice(0, -1)}X`;
    expect(nearMatch).toHaveLength(SECRET.length);
    expect(isWebhookSecretValid(SECRET, nearMatch)).toBe(false);
  });

  test("compares bytes, not characters", () => {
    // "séance" is 6 characters but 7 UTF-8 bytes, so a 6-character ASCII
    // candidate is a byte-length mismatch even though the lengths look equal.
    const multiByte = "séance";
    const sameCharCount = "seance";
    expect(multiByte).toHaveLength(sameCharCount.length);
    expect(Buffer.byteLength(multiByte, "utf8")).not.toBe(
      Buffer.byteLength(sameCharCount, "utf8"),
    );
    expect(isWebhookSecretValid(multiByte, sameCharCount)).toBe(false);
    expect(isWebhookSecretValid(multiByte, multiByte)).toBe(true);
  });
});
