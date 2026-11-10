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

import { afterEach, describe, expect, it, vi } from "vitest";

import { INTERCOM_EXTERNAL_ID_NAMESPACE } from "~@idaho-th/trpc/intercom/intercom.constants";
import { computeIntercomUserHash } from "~@idaho-th/trpc/intercom/intercom.messenger";
import { TEST_STAFF_PSEUDONYMIZED_ID } from "~@idaho-th/trpc/test/caller";

import { INTERCOM_MESSENGER_ENV } from "../intercom.constants";
import {
  getProviderMessengerAuth,
  getStaffMessengerAuth,
} from "../intercom.service";

const SECRET_KEY = INTERCOM_MESSENGER_ENV.IDENTITY_VERIFICATION_SECRET;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getStaffMessengerAuth", () => {
  it("builds the external_id from the staff pseudonymized id", () => {
    const result = getStaffMessengerAuth(TEST_STAFF_PSEUDONYMIZED_ID);

    expect(result.userId).toBe(
      `${INTERCOM_EXTERNAL_ID_NAMESPACE.STAFF}:${TEST_STAFF_PSEUDONYMIZED_ID}`,
    );
  });

  it("returns a null userHash when no verification secret is configured", () => {
    vi.stubEnv(SECRET_KEY, "");

    expect(
      getStaffMessengerAuth(TEST_STAFF_PSEUDONYMIZED_ID).userHash,
    ).toBeNull();
  });

  it("returns the HMAC userHash when the verification secret is set", () => {
    vi.stubEnv(SECRET_KEY, "test-secret");

    const result = getStaffMessengerAuth(TEST_STAFF_PSEUDONYMIZED_ID);

    expect(result.userHash).toBe(
      computeIntercomUserHash(result.userId, "test-secret"),
    );
  });

  it("returns the identity and nothing else", () => {
    const result = getStaffMessengerAuth(TEST_STAFF_PSEUDONYMIZED_ID);

    expect(Object.keys(result).sort()).toEqual(["userHash", "userId"]);
  });
});

describe("getProviderMessengerAuth", () => {
  it("builds the external_id from the provider user row id", () => {
    const result = getProviderMessengerAuth("provider-user-id");

    expect(result.userId).toBe(
      `${INTERCOM_EXTERNAL_ID_NAMESPACE.PROVIDER}:provider-user-id`,
    );
  });

  it("returns the HMAC userHash when the verification secret is set", () => {
    vi.stubEnv(SECRET_KEY, "test-secret");

    const result = getProviderMessengerAuth("provider-user-id");

    expect(result.userHash).toBe(
      computeIntercomUserHash(result.userId, "test-secret"),
    );
  });
});
