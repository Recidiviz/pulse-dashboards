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
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLE } from "~@idaho-th/shared";

import { useDocumentDownloadUrl, useDocumentsList } from "../documents";
import { AUTOCOMPLETE_MIN_CHARS, useAutocompleteAddresses } from "../places";
import {
  useApplicationDetailByRole,
  useCurrentApplicationDetail,
  useDismissProviderAlert,
  useProviderApplicationById,
  useStaffApplicationById,
  useStaffApplicationProviders,
} from "../useApplicationDetail";
import {
  useMarkProviderModalOpened,
  useMarkStaffModalOpened,
  useProviderTimeline,
  useStaffTimeline,
} from "../useTimeline";
import { createTrpcDouble, type TrpcDouble } from "./trpcHookDouble";

const trpcDouble: { current: TrpcDouble | undefined } = vi.hoisted(() => ({
  current: undefined,
}));
const storeRef = vi.hoisted(() => ({
  currentApplicationId: undefined as string | undefined,
  role: undefined as string | undefined,
}));

vi.mock("../../trpc/client", () => ({
  get trpc() {
    return trpcDouble.current?.trpc;
  },
}));

vi.mock("../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    currentApplicationId: storeRef.currentApplicationId,
  }),
  useUserStore: () => ({ user: { role: storeRef.role } }),
}));

let double: TrpcDouble;

beforeEach(() => {
  double = createTrpcDouble();
  trpcDouble.current = double;
  storeRef.currentApplicationId = undefined;
  storeRef.role = undefined;
});

/** Runs a mutation hook's onSuccess with the given variables. */
function fireOnSuccess(path: string, variables: unknown, data?: unknown) {
  const { options } = double.mutation(path);
  const onSuccess = options["onSuccess"] as
    | ((data: unknown, variables: unknown) => void)
    | undefined;
  if (!onSuccess) throw new Error(`${path} has no onSuccess`);
  onSuccess(data, variables);
}

describe("useApplicationDetail", () => {
  describe("useStaffApplicationById", () => {
    it("queries the staff procedure and never serves a stale detail", () => {
      renderHook(() => useStaffApplicationById("app-1", true));

      const query = double.query("housingApplication.getStaffApplicationById");
      expect(query.input).toEqual({ applicationId: "app-1" });
      expect(query.options["enabled"]).toBe(true);
      expect(query.options["staleTime"]).toBe(0);
    });

    it("stays disabled without an application id, and sends no empty lookup", () => {
      renderHook(() => useStaffApplicationById(undefined, true));

      const query = double.query("housingApplication.getStaffApplicationById");
      expect(query.options["enabled"]).toBe(false);
      expect(query.input).toEqual({ applicationId: "" });
    });

    it("stays disabled when the caller has not enabled it", () => {
      renderHook(() => useStaffApplicationById("app-1", false));

      expect(
        double.query("housingApplication.getStaffApplicationById").options[
          "enabled"
        ],
      ).toBe(false);
    });
  });

  describe("useProviderApplicationById", () => {
    it("queries the provider procedure", () => {
      renderHook(() => useProviderApplicationById("app-1", true));

      const query = double.query(
        "housingApplication.getProviderApplicationById",
      );
      expect(query.input).toEqual({ applicationId: "app-1" });
      expect(query.options["enabled"]).toBe(true);
    });

    it("stays disabled without an application id", () => {
      renderHook(() => useProviderApplicationById(undefined, true));

      expect(
        double.query("housingApplication.getProviderApplicationById").options[
          "enabled"
        ],
      ).toBe(false);
    });
  });

  describe("useApplicationDetailByRole", () => {
    it("enables only the staff query for staff and returns its data", () => {
      double.setQueryData("housingApplication.getStaffApplicationById", {
        id: "staff-detail",
      });
      double.setQueryData("housingApplication.getProviderApplicationById", {
        id: "provider-detail",
      });

      const { result } = renderHook(() =>
        useApplicationDetailByRole("app-1", USER_ROLE.STAFF),
      );

      expect(result.current).toEqual({ id: "staff-detail" });
      expect(
        double.query("housingApplication.getStaffApplicationById").options[
          "enabled"
        ],
      ).toBe(true);
      expect(
        double.query("housingApplication.getProviderApplicationById").options[
          "enabled"
        ],
      ).toBe(false);
    });

    it("enables only the provider query for a provider and returns its data", () => {
      double.setQueryData("housingApplication.getStaffApplicationById", {
        id: "staff-detail",
      });
      double.setQueryData("housingApplication.getProviderApplicationById", {
        id: "provider-detail",
      });

      const { result } = renderHook(() =>
        useApplicationDetailByRole("app-1", USER_ROLE.PROVIDER),
      );

      expect(result.current).toEqual({ id: "provider-detail" });
      expect(
        double.query("housingApplication.getStaffApplicationById").options[
          "enabled"
        ],
      ).toBe(false);
      expect(
        double.query("housingApplication.getProviderApplicationById").options[
          "enabled"
        ],
      ).toBe(true);
    });
  });

  describe("useStaffApplicationProviders", () => {
    it("passes the filters through to the procedure", () => {
      renderHook(() =>
        useStaffApplicationProviders("app-1", true, { status: ["WAITING"] }),
      );

      expect(
        double.query("housingApplication.getStaffApplicationProviders").input,
      ).toEqual({
        applicationId: "app-1",
        filters: { status: ["WAITING"] },
      });
    });

    it("sends undefined filters when none were given", () => {
      renderHook(() => useStaffApplicationProviders("app-1", true));

      expect(
        double.query("housingApplication.getStaffApplicationProviders").input,
      ).toEqual({ applicationId: "app-1", filters: undefined });
    });
  });

  describe("useDismissProviderAlert", () => {
    it("removes the alert from the cached detail and refreshes the list", () => {
      renderHook(() => useDismissProviderAlert("app-1"));

      fireOnSuccess("housingApplication.dismissProviderAlert", {
        alertId: "alert-1",
      });

      const [setData] = double.setDataCalls;
      expect(setData).toMatchObject({
        path: "housingApplication.getProviderApplicationById",
        input: { applicationId: "app-1" },
      });
      const kept = { id: "alert-2", type: "NEW_APPLICATION", metadata: null };
      expect(
        setData?.updater({
          id: "app-1",
          alerts: [{ ...kept, id: "alert-1" }, kept],
        }),
      ).toEqual({ id: "app-1", alerts: [kept] });
      expect(double.invalidatedPaths()).toEqual([
        "housingApplication.getProviderApplications",
      ]);
    });
  });

  describe("useCurrentApplicationDetail", () => {
    it("returns the whole detail record for the application the store has open", () => {
      storeRef.currentApplicationId = "app-1";
      storeRef.role = USER_ROLE.STAFF;
      double.setQueryData("housingApplication.getStaffApplicationById", {
        formData: { clientFirstName: "Jane" },
        stage: "APPLICATION",
      });

      const { result } = renderHook(() => useCurrentApplicationDetail());

      expect(result.current).toEqual({
        formData: { clientFirstName: "Jane" },
        stage: "APPLICATION",
      });
    });

    it("reads the provider's copy for a provider", () => {
      storeRef.currentApplicationId = "app-1";
      storeRef.role = USER_ROLE.PROVIDER;
      double.setQueryData("housingApplication.getProviderApplicationById", {
        formData: { clientFirstName: "John" },
      });

      const { result } = renderHook(() => useCurrentApplicationDetail());

      expect(result.current).toEqual({
        formData: { clientFirstName: "John" },
      });
    });

    it("passes the resolved preferredProviders sibling through alongside formData", () => {
      storeRef.currentApplicationId = "app-1";
      storeRef.role = USER_ROLE.STAFF;
      double.setQueryData("housingApplication.getStaffApplicationById", {
        formData: { clientFirstName: "Jane" },
        preferredProviders: [{ id: "provider-1", name: "Acme House" }],
      });

      const { result } = renderHook(() => useCurrentApplicationDetail());

      expect(result.current?.preferredProviders).toEqual([
        { id: "provider-1", name: "Acme House" },
      ]);
    });

    it("assumes staff when no role has loaded yet", () => {
      storeRef.currentApplicationId = "app-1";

      renderHook(() => useCurrentApplicationDetail());

      expect(
        double.query("housingApplication.getStaffApplicationById").options[
          "enabled"
        ],
      ).toBe(true);
    });

    it("returns undefined when no application is open", () => {
      storeRef.role = USER_ROLE.STAFF;

      const { result } = renderHook(() => useCurrentApplicationDetail());

      expect(result.current).toBeUndefined();
      expect(
        double.query("housingApplication.getStaffApplicationById").options[
          "enabled"
        ],
      ).toBe(false);
    });
  });
});

describe("useTimeline", () => {
  it("never serves a stale staff timeline", () => {
    renderHook(() => useStaffTimeline("app-1", true));

    const query = double.query("timeline.getForStaff");
    expect(query.input).toEqual({
      applicationId: "app-1",
      includeProviderNotSelected: false,
    });
    expect(query.options["staleTime"]).toBe(0);
    expect(query.options["enabled"]).toBe(true);
  });

  it("passes the provider-not-selected flag through", () => {
    renderHook(() => useStaffTimeline("app-1", true, true));

    expect(double.query("timeline.getForStaff").input).toEqual({
      applicationId: "app-1",
      includeProviderNotSelected: true,
    });
  });

  it("keeps the staff timeline disabled without an application id", () => {
    renderHook(() => useStaffTimeline(undefined, true));

    expect(double.query("timeline.getForStaff").options["enabled"]).toBe(false);
  });

  it("never serves a stale provider timeline", () => {
    renderHook(() => useProviderTimeline("app-1", true));

    const query = double.query("timeline.getForProvider");
    expect(query.input).toEqual({ applicationId: "app-1" });
    expect(query.options["staleTime"]).toBe(0);
  });

  it("keeps the provider timeline disabled without an application id", () => {
    renderHook(() => useProviderTimeline(undefined, true));

    expect(double.query("timeline.getForProvider").options["enabled"]).toBe(
      false,
    );
  });

  it("refreshes the staff dashboard once the modal is marked opened", () => {
    // The "New Updates" pill lives on the list, not the timeline, so the list
    // has to be invalidated too.
    renderHook(() => useMarkStaffModalOpened());

    fireOnSuccess("timeline.markModalOpenedForStaff", {
      applicationId: "app-1",
    });

    expect(double.invalidatedPaths()).toEqual([
      "housingApplication.getByStaff",
    ]);
  });

  it("refreshes the provider dashboard once the modal is marked opened", () => {
    renderHook(() => useMarkProviderModalOpened());

    fireOnSuccess("timeline.markModalOpenedForProvider", {
      applicationId: "app-1",
    });

    expect(double.invalidatedPaths()).toEqual([
      "housingApplication.getProviderApplications",
    ]);
  });
});

describe("documents hooks", () => {
  describe("useDocumentsList", () => {
    it("enables only the staff list for staff", () => {
      double.setQueryData("documents.listForStaff", { documents: ["staff"] });

      const { result } = renderHook(() =>
        useDocumentsList("app-1", USER_ROLE.STAFF),
      );

      expect(result.current.data).toEqual({ documents: ["staff"] });
      expect(double.query("documents.listForStaff").options["enabled"]).toBe(
        true,
      );
      expect(double.query("documents.listForProvider").options["enabled"]).toBe(
        false,
      );
    });

    it("enables only the provider list for a provider", () => {
      double.setQueryData("documents.listForProvider", {
        documents: ["provider"],
      });

      const { result } = renderHook(() =>
        useDocumentsList("app-1", USER_ROLE.PROVIDER),
      );

      expect(result.current.data).toEqual({ documents: ["provider"] });
      expect(double.query("documents.listForStaff").options["enabled"]).toBe(
        false,
      );
      expect(double.query("documents.listForProvider").options["enabled"]).toBe(
        true,
      );
    });

    it("disables both lists without an application id", () => {
      renderHook(() => useDocumentsList(undefined, USER_ROLE.STAFF));

      expect(double.query("documents.listForStaff").options["enabled"]).toBe(
        false,
      );
      expect(double.query("documents.listForProvider").options["enabled"]).toBe(
        false,
      );
    });

    it("never serves a stale document list", () => {
      renderHook(() => useDocumentsList("app-1", USER_ROLE.STAFF));

      expect(double.query("documents.listForStaff").options["staleTime"]).toBe(
        0,
      );
    });
  });

  describe("useDocumentDownloadUrl", () => {
    it("mints a staff download URL through the staff procedure and invalidates the staff timeline", async () => {
      double.setQueryData(
        "documents.getDownloadUrlForStaff",
        "https://gcs.example.com/staff",
      );
      const { result } = renderHook(() =>
        useDocumentDownloadUrl(USER_ROLE.STAFF),
      );

      await expect(result.current("doc-1", "app-1")).resolves.toBe(
        "https://gcs.example.com/staff",
      );
      expect(double.fetches).toEqual([
        {
          path: "documents.getDownloadUrlForStaff",
          input: { documentId: "doc-1" },
        },
      ]);
      expect(double.invalidations).toEqual([
        { path: "timeline.getForStaff", input: { applicationId: "app-1" } },
      ]);
    });

    it("mints a provider download URL through the provider procedure and invalidates the provider timeline", async () => {
      double.setQueryData(
        "documents.getDownloadUrlForProvider",
        "https://gcs.example.com/provider",
      );
      const { result } = renderHook(() =>
        useDocumentDownloadUrl(USER_ROLE.PROVIDER),
      );

      await expect(result.current("doc-1", "app-1")).resolves.toBe(
        "https://gcs.example.com/provider",
      );
      expect(double.fetchedPaths()).toEqual([
        "documents.getDownloadUrlForProvider",
      ]);
      expect(double.invalidatedPaths()).toEqual(["timeline.getForProvider"]);
    });

    it("returns a stable callback per role", () => {
      const { result, rerender } = renderHook(
        ({ role }: { role: "staff" | "provider" }) =>
          useDocumentDownloadUrl(role),
        { initialProps: { role: USER_ROLE.STAFF as "staff" | "provider" } },
      );
      const first = result.current;

      rerender({ role: USER_ROLE.STAFF });
      expect(result.current).toBe(first);

      rerender({ role: USER_ROLE.PROVIDER });
      expect(result.current).not.toBe(first);
    });
  });
});

describe("places hooks", () => {
  it("waits for enough characters before autocompleting", () => {
    renderHook(() =>
      useAutocompleteAddresses("1".repeat(AUTOCOMPLETE_MIN_CHARS - 1), true),
    );

    expect(
      double.query("places.autocompleteAddresses").options["enabled"],
    ).toBe(false);
  });

  it("autocompletes once the minimum length is reached", () => {
    renderHook(() =>
      useAutocompleteAddresses("1".repeat(AUTOCOMPLETE_MIN_CHARS), true),
    );

    const query = double.query("places.autocompleteAddresses");
    expect(query.options["enabled"]).toBe(true);
    expect(query.input).toEqual({ input: "111" });
  });

  it("stays disabled when the caller has not enabled it", () => {
    renderHook(() => useAutocompleteAddresses("123 Main St", false));

    expect(
      double.query("places.autocompleteAddresses").options["enabled"],
    ).toBe(false);
  });

  it("handles its own errors instead of toasting a typo-driven failure", () => {
    renderHook(() => useAutocompleteAddresses("123 Main St", true));

    expect(
      double.query("places.autocompleteAddresses").options["meta"],
    ).toEqual({ suppressGlobalError: true });
  });
});
