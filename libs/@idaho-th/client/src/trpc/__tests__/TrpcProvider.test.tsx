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

import { useMutation, useQuery } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { TRPCClientError } from "@trpc/client";
import { useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
  HOUSING_PROVIDER_REQUIRED_MESSAGE,
  IDAHO_TH_ACTIVE_PROVIDER_HEADER,
  USER_ROLE,
} from "~@idaho-th/shared";

import type { IdahoTHStore } from "../../datastores/IdahoTHStore";
import { buildIdahoTHStore, StoreWrapper } from "../../test/renderWithStore";
import { TrpcProvider } from "../TrpcProvider";

const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("react-hot-toast", () => ({
  default: { error: toastErrorMock },
}));

type CapturedLinkOptions = {
  url: string;
  maxURLLength?: number;
  methodOverride?: string;
  headers?: () => Promise<Record<string, string>>;
};

const capturedLinkOptions: { current: CapturedLinkOptions | undefined } =
  vi.hoisted(() => ({ current: undefined }));

vi.mock("@trpc/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@trpc/client")>()),
  // The link is never invoked: nothing in this suite makes a tRPC request, so
  // capturing its options is enough to assert what goes on the wire.
  httpBatchLink: (options: CapturedLinkOptions) => {
    capturedLinkOptions.current = options;
    return () => () => ({
      subscribe: () => ({ unsubscribe: () => undefined }),
    });
  },
}));

/** A TRPCClientError carrying the shape the server actually sends. */
function trpcError(code: string, message = "boom"): TRPCClientError<never> {
  const error = new TRPCClientError<never>(message);
  Object.defineProperty(error, "data", {
    value: { code },
    configurable: true,
  });
  return error;
}

function FailingQuery({ meta }: { meta?: Record<string, unknown> }) {
  useQuery({
    queryKey: ["failing"],
    queryFn: () => Promise.reject(queryError),
    retry: false,
    ...(meta ? { meta } : {}),
  });
  return null;
}

function FailingMutation({
  meta,
  onError,
}: {
  meta?: Record<string, unknown>;
  onError?: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () => Promise.reject(queryError),
    retry: false,
    ...(meta ? { meta } : {}),
    ...(onError ? { onError } : {}),
  });

  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    mutation.mutate();
  }, [mutation]);

  return null;
}

let queryError: unknown;

beforeEach(() => {
  vi.clearAllMocks();
  capturedLinkOptions.current = undefined;
  queryError = new Error("network down");
  window.__IDAHO_TH_CONFIG__ = {
    AUTH0_DOMAIN: "auth.example.com",
    AUTH0_CLIENT_ID: "client-id",
    AUTH0_AUDIENCE: "https://api.example.com",
    API_URL: "https://api.example.com/trpc",
    APP_ENV: "test",
  };
});

afterEach(() => {
  delete window.__IDAHO_TH_CONFIG__;
});

describe("TrpcProvider", () => {
  describe("bearer token handling", () => {
    it("sends the token in an Authorization header and nowhere else", async () => {
      const getToken = vi.fn().mockResolvedValue("jwt-abc");

      render(
        <TrpcProvider getToken={getToken}>
          <span>child</span>
        </TrpcProvider>,
      );

      const headers = await capturedLinkOptions.current?.headers?.();

      expect(headers).toEqual({ Authorization: "Bearer jwt-abc" });
      // The token must never reach the URL, where it would land in history,
      // referrers and access logs.
      expect(capturedLinkOptions.current?.url).toBe(
        "https://api.example.com/trpc",
      );
      expect(capturedLinkOptions.current?.url).not.toContain("jwt-abc");
    });

    it("sends no Authorization header when no getToken is supplied", async () => {
      render(
        <TrpcProvider>
          <span>child</span>
        </TrpcProvider>,
      );

      expect(await capturedLinkOptions.current?.headers?.()).toEqual({});
    });

    it("sends no Authorization header when getToken resolves undefined", async () => {
      // Guards against emitting a literal "Bearer undefined", which the server
      // would reject in a way that looks like an expired session.
      const getToken = vi.fn().mockResolvedValue(undefined);

      render(
        <TrpcProvider getToken={getToken}>
          <span>child</span>
        </TrpcProvider>,
      );

      expect(await capturedLinkOptions.current?.headers?.()).toEqual({});
    });

    it("sends no Authorization header when getToken resolves an empty string", async () => {
      const getToken = vi.fn().mockResolvedValue("");

      render(
        <TrpcProvider getToken={getToken}>
          <span>child</span>
        </TrpcProvider>,
      );

      expect(await capturedLinkOptions.current?.headers?.()).toEqual({});
    });

    it("reads the latest getToken after a re-render, not the one captured at mount", async () => {
      // The client is built once in useState; without the ref indirection a
      // refreshed token would never be picked up.
      const first = vi.fn().mockResolvedValue("stale-token");
      const second = vi.fn().mockResolvedValue("fresh-token");

      const { rerender } = render(
        <TrpcProvider getToken={first}>
          <span>child</span>
        </TrpcProvider>,
      );
      rerender(
        <TrpcProvider getToken={second}>
          <span>child</span>
        </TrpcProvider>,
      );

      expect(await capturedLinkOptions.current?.headers?.()).toEqual({
        Authorization: "Bearer fresh-token",
      });
      expect(first).not.toHaveBeenCalled();
    });
  });

  describe("unauthorized handling", () => {
    it("calls onUnauthorized and shows no toast for an UNAUTHORIZED query error", async () => {
      queryError = trpcError("UNAUTHORIZED");
      const onUnauthorized = vi.fn();

      render(
        <TrpcProvider onUnauthorized={onUnauthorized}>
          <FailingQuery />
        </TrpcProvider>,
      );

      await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("calls onUnauthorized for an UNAUTHORIZED mutation error", async () => {
      queryError = trpcError("UNAUTHORIZED");
      const onUnauthorized = vi.fn();

      render(
        <TrpcProvider onUnauthorized={onUnauthorized}>
          <FailingMutation />
        </TrpcProvider>,
      );

      await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("does not toast an UNAUTHORIZED error even with no onUnauthorized handler", async () => {
      queryError = trpcError("UNAUTHORIZED");

      render(
        <TrpcProvider>
          <FailingQuery />
        </TrpcProvider>,
      );

      // Nothing to await on; give the query a tick to settle and reject.
      await waitFor(() => expect(toastErrorMock).not.toHaveBeenCalled());
    });

    it("treats a FORBIDDEN error as an ordinary failure, not a session expiry", async () => {
      queryError = trpcError("FORBIDDEN");
      const onUnauthorized = vi.fn();

      render(
        <TrpcProvider onUnauthorized={onUnauthorized}>
          <FailingQuery />
        </TrpcProvider>,
      );

      await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it("treats a plain Error with an UNAUTHORIZED-looking message as an ordinary failure", async () => {
      queryError = new Error("UNAUTHORIZED");
      const onUnauthorized = vi.fn();

      render(
        <TrpcProvider onUnauthorized={onUnauthorized}>
          <FailingQuery />
        </TrpcProvider>,
      );

      await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
      expect(onUnauthorized).not.toHaveBeenCalled();
    });
  });

  describe("global error toasts", () => {
    it("toasts a generic message for a failing query", async () => {
      render(
        <TrpcProvider>
          <FailingQuery />
        </TrpcProvider>,
      );

      await waitFor(() =>
        expect(toastErrorMock).toHaveBeenCalledWith("An error occurred", {
          id: "An error occurred",
        }),
      );
    });

    it("never surfaces the raw server error text", async () => {
      queryError = trpcError(
        "INTERNAL_SERVER_ERROR",
        'relation "housing_application" does not exist\n    at Object.request',
      );

      render(
        <TrpcProvider>
          <FailingQuery />
        </TrpcProvider>,
      );

      await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
      expect(toastErrorMock).toHaveBeenCalledWith("An error occurred", {
        id: "An error occurred",
      });
    });

    it("suppresses the toast for a query that opted out", async () => {
      render(
        <TrpcProvider>
          <FailingQuery meta={{ suppressGlobalError: true }} />
        </TrpcProvider>,
      );

      await waitFor(() => expect(toastErrorMock).not.toHaveBeenCalled());
    });

    it("toasts a failing mutation that did not opt out", async () => {
      render(
        <TrpcProvider>
          <FailingMutation />
        </TrpcProvider>,
      );

      await waitFor(() =>
        expect(toastErrorMock).toHaveBeenCalledWith("An error occurred", {
          id: "An error occurred",
        }),
      );
    });

    it("suppresses the toast for a mutation that opted out", async () => {
      render(
        <TrpcProvider>
          <FailingMutation meta={{ suppressGlobalError: true }} />
        </TrpcProvider>,
      );

      await waitFor(() => expect(toastErrorMock).not.toHaveBeenCalled());
    });

    it("suppresses the toast for a mutation that handles the error itself", async () => {
      const onError = vi.fn();

      render(
        <TrpcProvider>
          <FailingMutation onError={onError} />
        </TrpcProvider>,
      );

      await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
      expect(toastErrorMock).not.toHaveBeenCalled();
    });
  });

  describe("the active provider header", () => {
    const HOUSING_PROVIDER = {
      id: "housing-provider-a",
      name: "Sunrise House",
    };

    function renderWithActiveHousingProvider(store: IdahoTHStore) {
      return render(
        <StoreWrapper store={store}>
          <TrpcProvider getToken={vi.fn().mockResolvedValue("jwt-abc")}>
            <span>child</span>
          </TrpcProvider>
        </StoreWrapper>,
      );
    }

    it("sends the provider the store holds, and sends it nowhere else", async () => {
      const store = buildIdahoTHStore({ role: USER_ROLE.PROVIDER });
      store.housingProviderStore.setActiveHousingProvider(HOUSING_PROVIDER);

      renderWithActiveHousingProvider(store);

      const headers = await capturedLinkOptions.current?.headers?.();

      expect(headers).toEqual({
        Authorization: "Bearer jwt-abc",
        [IDAHO_TH_ACTIVE_PROVIDER_HEADER]: HOUSING_PROVIDER.id,
      });
      // Never a URL, a query parameter, or browser storage.
      expect(capturedLinkOptions.current?.url).not.toContain(
        HOUSING_PROVIDER.id,
      );
      expect(window.localStorage.length).toBe(0);
      expect(window.sessionStorage.length).toBe(0);
    });

    it("sends no provider header for a staff session", async () => {
      renderWithActiveHousingProvider(
        buildIdahoTHStore({ role: USER_ROLE.STAFF }),
      );

      expect(await capturedLinkOptions.current?.headers?.()).toEqual({
        Authorization: "Bearer jwt-abc",
      });
    });

    it("reads the provider at request time, not at mount", async () => {
      // The client is built once in useState, so a switch after mount would
      // otherwise keep sending the organization the portal opened with.
      const store = buildIdahoTHStore({ role: USER_ROLE.PROVIDER });
      renderWithActiveHousingProvider(store);

      store.housingProviderStore.setActiveHousingProvider(HOUSING_PROVIDER);

      expect(await capturedLinkOptions.current?.headers?.()).toEqual({
        Authorization: "Bearer jwt-abc",
        [IDAHO_TH_ACTIVE_PROVIDER_HEADER]: HOUSING_PROVIDER.id,
      });
    });

    it("sends no provider header when rendered outside the store", async () => {
      render(
        <TrpcProvider>
          <span>child</span>
        </TrpcProvider>,
      );

      expect(await capturedLinkOptions.current?.headers?.()).toEqual({});
    });
  });

  describe("forbidden error discrimination", () => {
    const HOUSING_PROVIDER = {
      id: "housing-provider-a",
      name: "Sunrise House",
    };

    let onUnauthorizedMock: ReturnType<typeof vi.fn>;
    let store: IdahoTHStore;

    function renderFailingQuery(withStore: IdahoTHStore) {
      return render(
        <StoreWrapper store={withStore}>
          <TrpcProvider onUnauthorized={onUnauthorizedMock}>
            <FailingQuery />
          </TrpcProvider>
        </StoreWrapper>,
      );
    }

    beforeEach(() => {
      onUnauthorizedMock = vi.fn();
      store = buildIdahoTHStore({ role: USER_ROLE.PROVIDER });
      store.housingProviderStore.setActiveHousingProvider(HOUSING_PROVIDER);
    });

    it("clears the provider and routes to the picker on the dedicated message", async () => {
      queryError = trpcError("FORBIDDEN", HOUSING_PROVIDER_REQUIRED_MESSAGE);

      renderFailingQuery(store);

      await waitFor(() =>
        expect(store.housingProviderStore.mustSelectHousingProvider).toBe(true),
      );
      expect(store.housingProviderStore.activeProviderId).toBeNull();
      expect(toastErrorMock).not.toHaveBeenCalled();
      expect(onUnauthorizedMock).not.toHaveBeenCalled();
    });

    it("clears the provider, routes to the picker and toasts on the access-denied message", async () => {
      queryError = trpcError(
        "FORBIDDEN",
        HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
      );

      renderFailingQuery(store);

      await waitFor(() =>
        expect(store.housingProviderStore.mustSelectHousingProvider).toBe(true),
      );
      expect(store.housingProviderStore.activeProviderId).toBeNull();
      // The id is what keeps a batch of refused queries to one denial.
      expect(toastErrorMock).toHaveBeenCalledWith(
        HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
        { id: HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE },
      );
      expect(onUnauthorizedMock).not.toHaveBeenCalled();
    });

    it("toasts and does not route for any other forbidden error", async () => {
      // `setActive` refusing an unassigned organization. Bouncing to the picker
      // would hide a genuine cross-organization denial.
      queryError = trpcError("FORBIDDEN", "Provider not available");

      renderFailingQuery(store);

      await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
      expect(store.housingProviderStore.activeProviderId).toBe(
        HOUSING_PROVIDER.id,
      );
      expect(store.housingProviderStore.mustSelectHousingProvider).toBe(false);
    });

    it("leaves the provider alone and signs the user out on UNAUTHORIZED", async () => {
      queryError = trpcError("UNAUTHORIZED", "Provider account not found");

      renderFailingQuery(store);

      await waitFor(() => expect(onUnauthorizedMock).toHaveBeenCalledTimes(1));
      expect(store.housingProviderStore.activeProviderId).toBe(
        HOUSING_PROVIDER.id,
      );
      expect(store.housingProviderStore.mustSelectHousingProvider).toBe(false);
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("does not route on the dedicated message carried by a non-forbidden code", async () => {
      queryError = trpcError(
        "INTERNAL_SERVER_ERROR",
        HOUSING_PROVIDER_REQUIRED_MESSAGE,
      );

      renderFailingQuery(store);

      await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
      expect(store.housingProviderStore.mustSelectHousingProvider).toBe(false);
    });
  });

  it("renders its children", () => {
    const { getByText } = render(
      <TrpcProvider>
        <span>child content</span>
      </TrpcProvider>,
    );

    expect(getByText("child content")).toBeInTheDocument();
  });
});
