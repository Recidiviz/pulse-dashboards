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

import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdTokenMock = vi.hoisted(() => vi.fn());

vi.mock("google-auth-library", () => {
  class OAuth2Client {
    verifyIdToken(...args: unknown[]) {
      return verifyIdTokenMock(...args);
    }
  }
  return { OAuth2Client };
});

import { verifyGcsScanWebhookToken } from "../verifyGcsScanWebhookToken";

const audience =
  "https://idaho-th-server.example.com/internal/gcs-object-scanned";
const expectedInvokerEmail = "scanner@my-project.iam.gserviceaccount.com";

function mockPayload(payload: Record<string, unknown> | null) {
  verifyIdTokenMock.mockResolvedValue({
    getPayload: () => payload,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyGcsScanWebhookToken", () => {
  it("rejects a missing Authorization header", async () => {
    const result = await verifyGcsScanWebhookToken({
      authorizationHeader: undefined,
      audience,
      expectedInvokerEmail,
    });

    expect(result).toEqual({ valid: false, reason: "missing_token" });
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it("rejects a header that is not a Bearer token", async () => {
    const result = await verifyGcsScanWebhookToken({
      authorizationHeader: "Basic abc123",
      audience,
      expectedInvokerEmail,
    });

    expect(result).toEqual({ valid: false, reason: "missing_token" });
  });

  it("rejects when verifyIdToken throws (bad signature/audience)", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("Wrong recipient"));

    const result = await verifyGcsScanWebhookToken({
      authorizationHeader: "Bearer bad-token",
      audience,
      expectedInvokerEmail,
    });

    expect(result).toEqual({ valid: false, reason: "invalid_token" });
    expect(verifyIdTokenMock).toHaveBeenCalledWith({
      idToken: "bad-token",
      audience,
    });
  });

  it("rejects an unverified email", async () => {
    mockPayload({ email: expectedInvokerEmail, email_verified: false });

    const result = await verifyGcsScanWebhookToken({
      authorizationHeader: "Bearer good-token",
      audience,
      expectedInvokerEmail,
    });

    expect(result).toEqual({ valid: false, reason: "email_not_verified" });
  });

  it("rejects a token from an unexpected invoker", async () => {
    mockPayload({
      email: "someone-else@other-project.iam.gserviceaccount.com",
      email_verified: true,
    });

    const result = await verifyGcsScanWebhookToken({
      authorizationHeader: "Bearer good-token",
      audience,
      expectedInvokerEmail,
    });

    expect(result).toEqual({ valid: false, reason: "unexpected_invoker" });
  });

  it("accepts a verified token from the expected invoker", async () => {
    mockPayload({ email: expectedInvokerEmail, email_verified: true });

    const result = await verifyGcsScanWebhookToken({
      authorizationHeader: "Bearer good-token",
      audience,
      expectedInvokerEmail,
    });

    expect(result).toEqual({ valid: true });
  });
});
