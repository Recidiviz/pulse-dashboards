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

import { TRPCClientError } from "@trpc/client";
import { describe, expect, it } from "vitest";

import { PROVIDER_RESPONSE_ERROR_MESSAGE } from "~@idaho-th/shared";

import { getSubmitProviderResponseErrorMessage } from "../providerResponse.errors";

const trpcError = (code: string, message: string) =>
  Object.assign(new TRPCClientError(message), { data: { code } });

describe("getSubmitProviderResponseErrorMessage", () => {
  it("maps known bad-request messages", () => {
    const error = trpcError(
      "BAD_REQUEST",
      PROVIDER_RESPONSE_ERROR_MESSAGE.ALREADY_RESPONDED,
    );
    expect(getSubmitProviderResponseErrorMessage(error)).toBe(
      "A response has already been submitted for this application.",
    );
  });

  it("falls back for unknown bad-request messages", () => {
    expect(
      getSubmitProviderResponseErrorMessage(trpcError("BAD_REQUEST", "x")),
    ).toBe("We couldn't submit your response. Please refresh and try again.");
  });

  it("explains a missing application", () => {
    expect(
      getSubmitProviderResponseErrorMessage(trpcError("NOT_FOUND", "x")),
    ).toBe("This application is no longer available to your organization.");
  });

  it("reports connectivity problems when there is no server code", () => {
    expect(
      getSubmitProviderResponseErrorMessage(
        new TRPCClientError("fetch failed"),
      ),
    ).toBe("Unable to reach the server. Check your connection and try again.");
  });

  it("uses the default for server failures and non-tRPC errors", () => {
    const fallback =
      "We couldn't submit your response. Please refresh and try again.";
    expect(
      getSubmitProviderResponseErrorMessage(
        trpcError("INTERNAL_SERVER_ERROR", "x"),
      ),
    ).toBe(fallback);
    expect(getSubmitProviderResponseErrorMessage(new Error("x"))).toBe(
      fallback,
    );
  });
});
