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

import { renderHook } from "@testing-library/react";
import { TRPCClientError } from "@trpc/client";

import {
  useUpdateHousingProvider,
  useUpdateProviderProfile,
} from "../providerSettings";
import { createTrpcDouble, type TrpcDouble } from "./trpcHookDouble";

const trpcDouble: { current: TrpcDouble | undefined } = vi.hoisted(() => ({
  current: undefined,
}));
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("../../trpc/client", () => ({
  get trpc() {
    return trpcDouble.current?.trpc;
  },
}));

vi.mock("react-hot-toast", () => ({ default: { error: toastErrorMock } }));

let double: TrpcDouble;

beforeEach(() => {
  double = createTrpcDouble();
  trpcDouble.current = double;
  toastErrorMock.mockClear();
});

const HOUSING_PROVIDER_PATH = "housingApplication.updateHousingProvider";
const PROFILE_PATH = "housingApplication.updateProviderProfile";

function handlerFor(path: string, name: string) {
  const handler = double.mutation(path).options[name];
  if (typeof handler !== "function") {
    throw new Error(`${path} has no ${name}`);
  }
  return handler as (...args: unknown[]) => void;
}

/** A server error as the tRPC client surfaces it to `onError`. */
function clientError(code: string, message: string) {
  return TRPCClientError.from({
    error: { message, code: -32600, data: { code } },
  } as never);
}

describe("useUpdateHousingProvider", () => {
  it("refreshes both the settings payload and the provider name in the header", () => {
    renderHook(() => useUpdateHousingProvider());

    handlerFor(HOUSING_PROVIDER_PATH, "onSettled")();

    expect(double.invalidatedPaths()).toEqual(
      expect.arrayContaining([
        "housingApplication.getProviderDetails",
        "housingApplication.getCurrentProvider",
      ]),
    );
  });

  it("shows the server's actionable message when the name is already taken", () => {
    renderHook(() => useUpdateHousingProvider());

    handlerFor(HOUSING_PROVIDER_PATH, "onError")(
      clientError(
        "CONFLICT",
        "That provider name is already in use. Please choose a different name.",
      ),
      { housingProviderName: "Other Provider" },
      undefined,
    );

    expect(toastErrorMock).toHaveBeenCalledWith(
      "That provider name is already in use. Please choose a different name.",
      {
        id: "That provider name is already in use. Please choose a different name.",
      },
    );
  });

  it("falls back to a generic message for any other failure", () => {
    renderHook(() => useUpdateHousingProvider());

    handlerFor(HOUSING_PROVIDER_PATH, "onError")(
      clientError("INTERNAL_SERVER_ERROR", "Unique constraint failed"),
      { housingProviderName: "Renamed Housing" },
      undefined,
    );

    expect(toastErrorMock).toHaveBeenCalledWith(
      "Failed to save provider settings.",
      { id: "Failed to save provider settings." },
    );
  });
});

describe("useUpdateProviderProfile", () => {
  it("refreshes the settings payload only: no provider cache is involved", () => {
    renderHook(() => useUpdateProviderProfile());

    handlerFor(PROFILE_PATH, "onSettled")();

    expect(double.invalidatedPaths()).toEqual([
      "housingApplication.getProviderDetails",
    ]);
  });

  it("toasts its own message when a personal save fails", () => {
    renderHook(() => useUpdateProviderProfile());

    handlerFor(PROFILE_PATH, "onError")(
      new Error("boom"),
      { contactName: "John Doe" },
      undefined,
    );

    expect(toastErrorMock).toHaveBeenCalledWith(
      "Failed to save your personal details.",
      { id: "Failed to save your personal details." },
    );
  });
});
