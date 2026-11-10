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

import { keepPreviousData } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { TRPCClientError } from "@trpc/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PROVIDER_RESPONSE_TYPE } from "~@idaho-th/shared";

import {
  useAcceptProviderAsHomePlan,
  useAcknowledgeApprovalRevoked,
  useAdvanceApplicationStage,
  useCurrentProvider,
  useDeleteHousingApplication,
  useDuplicateHousingApplication,
  useEditProviderInfoRequestMessage,
  useExtractContent,
  useHousingProviders,
  usePostStaffInfoReply,
  useProviderDetails,
  useProviderHomePlan,
  useProviderHousingApplications,
  useProviderInfoRequests,
  useProvidersWithEligibility,
  useSendApplicationToProviders,
  useSetHomePlanApprovals,
  useSetManualAddressHomePlan,
  useStaffHomePlan,
  useStaffHousingApplications,
  useSubmitDraftHousingApplication,
  useSubmitProviderResponse,
  useToggleEligibleProviderSelection,
  useToggleProviderHomePlanReleaseTask,
  useToggleStaffHomePlanReleaseTask,
  useUpdateHomePlanReleaseTaskDetail,
  useUpdateHousingApplication,
  useUpdateProviderLocation,
} from "../housingApplication";
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

const APPLICATION_ID = "app-1";

const trpcError = (code: string, message: string) =>
  Object.assign(new TRPCClientError(message), { data: { code } });

type Callback = "onSuccess" | "onSettled";

/**
 * Renders a mutation hook, runs the callback that owns its cache work, and
 * returns the procedures it invalidated.
 */
function invalidationsFor(
  hook: () => unknown,
  path: string,
  callback: Callback,
  variables: Record<string, unknown> = { applicationId: APPLICATION_ID },
  data: unknown = { applicationId: APPLICATION_ID },
): string[] {
  renderHook(hook);
  const { options } = double.mutation(path);
  const handler = options[callback] as
    | ((...args: unknown[]) => void)
    | undefined;
  if (!handler) throw new Error(`${path} has no ${callback}`);

  if (callback === "onSuccess") handler(data, variables);
  else handler(data, undefined, variables);

  return double.invalidatedPaths().sort();
}

describe("housingApplication query hooks", () => {
  it("keeps the previous page of staff applications while the next loads", () => {
    const params = { pagination: { pageSize: 8 } };

    renderHook(() => useStaffHousingApplications(params));

    const query = double.query("housingApplication.getByStaff");
    expect(query.input).toBe(params);
    expect(query.options["placeholderData"]).toBe(keepPreviousData);
  });

  it("keeps the previous page of provider applications while the next loads", () => {
    const params = { pagination: { pageSize: 8 } };

    renderHook(() => useProviderHousingApplications(params));

    const query = double.query("housingApplication.getProviderApplications");
    expect(query.input).toBe(params);
    expect(query.options["placeholderData"]).toBe(keepPreviousData);
  });

  it("passes eligibility params and search to the eligibility query", () => {
    const eligibilityParams = { gender: "MALE" } as never;

    renderHook(() =>
      useProvidersWithEligibility(
        eligibilityParams,
        { name: "House" } as never,
        {
          enabled: true,
        },
      ),
    );

    const query = double.query(
      "housingApplication.getProvidersWithEligibility",
    );
    expect(query.input).toEqual({
      eligibilityParams,
      search: { name: "House" },
    });
    expect(query.options["enabled"]).toBe(true);
  });

  it("leaves the eligibility query's enabled flag undefined when unspecified", () => {
    renderHook(() => useProvidersWithEligibility({} as never));

    expect(
      double.query("housingApplication.getProvidersWithEligibility").options[
        "enabled"
      ],
    ).toBeUndefined();
  });

  describe("useHousingProviders", () => {
    it("defaults to a name-distinct provider list and unwraps the rows", () => {
      double.setQueryData("housingApplication.getProviders", {
        providers: [{ id: "provider-1" }],
      });

      const { result } = renderHook(() => useHousingProviders());

      expect(double.query("housingApplication.getProviders").input).toEqual({
        search: undefined,
        distinct: ["name"],
      });
      expect(result.current.providers).toEqual([{ id: "provider-1" }]);
    });

    it("returns an empty list rather than undefined before data arrives", () => {
      const { result } = renderHook(() => useHousingProviders());

      expect(result.current.providers).toEqual([]);
      expect(result.current.isError).toBe(false);
    });

    it("honours an explicit distinct and search", () => {
      renderHook(() =>
        useHousingProviders({
          search: { name: "House" } as never,
          distinct: ["id"],
        }),
      );

      expect(double.query("housingApplication.getProviders").input).toEqual({
        search: { name: "House" },
        distinct: ["id"],
      });
    });
  });

  it("fetches the signed-in provider with no input", () => {
    renderHook(() => useCurrentProvider());

    expect(
      double.query("housingApplication.getCurrentProvider").input,
    ).toBeUndefined();
  });

  it("gates the provider-details query on the caller's flag", () => {
    renderHook(() => useProviderDetails(false));

    expect(
      double.query("housingApplication.getProviderDetails").options["enabled"],
    ).toBe(false);
  });

  it.each([["useStaffHomePlan", "housingApplication.getStaffHomePlan"]])(
    "%s stays disabled without an application id",
    (_name, path) => {
      renderHook(() => useStaffHomePlan(undefined));

      expect(double.query(path).options["enabled"]).toBe(false);
      expect(double.query(path).input).toEqual({ applicationId: "" });
    },
  );

  it("enables the staff home plan once an application is open", () => {
    renderHook(() => useStaffHomePlan(APPLICATION_ID));

    expect(
      double.query("housingApplication.getStaffHomePlan").options["enabled"],
    ).toBe(true);
  });

  it.each([
    [true, APPLICATION_ID, true],
    [false, APPLICATION_ID, false],
    [true, undefined, false],
  ])(
    "gates the provider home plan on both id and enabled (%s, %s)",
    (enabled, applicationId, expected) => {
      renderHook(() => useProviderHomePlan(applicationId, enabled));

      expect(
        double.query("housingApplication.getProviderHomePlan").options[
          "enabled"
        ],
      ).toBe(expected);
    },
  );

  it.each([
    [true, APPLICATION_ID, true],
    [false, APPLICATION_ID, false],
    [true, undefined, false],
  ])(
    "gates the provider info request on both id and enabled (%s, %s)",
    (enabled, applicationId, expected) => {
      renderHook(() => useProviderInfoRequests(applicationId, enabled));

      expect(
        double.query("housingApplication.getProviderInfoRequest").options[
          "enabled"
        ],
      ).toBe(expected);
    },
  );
});

/**
 * Every mutation in this file exists to invalidate a specific set of queries.
 * A forgotten `invalidate()` leaves the dashboard showing stale data, and an
 * extra one costs a needless refetch — so the assertion is the exact set.
 */
describe("housingApplication mutation cache contracts", () => {
  it.each<[string, () => unknown, string, Callback, string[]]>([
    [
      "useSubmitDraftHousingApplication",
      useSubmitDraftHousingApplication,
      "housingApplication.submitDraft",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
      ],
    ],
    [
      "useUpdateHousingApplication",
      useUpdateHousingApplication,
      "housingApplication.update",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
        "timeline.getForStaff",
      ],
    ],
    [
      "useDeleteHousingApplication",
      useDeleteHousingApplication,
      "housingApplication.delete",
      "onSuccess",
      ["housingApplication.getByStaff"],
    ],
    [
      "useSendApplicationToProviders",
      useSendApplicationToProviders,
      "housingApplication.sendToProviders",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
        "housingApplication.getStaffApplicationProviders",
        "timeline.getForStaff",
      ],
    ],
    [
      "useEditProviderInfoRequestMessage",
      useEditProviderInfoRequestMessage,
      "housingApplication.editProviderInfoRequestMessage",
      "onSuccess",
      ["housingApplication.getProviderInfoRequest"],
    ],
    [
      "usePostStaffInfoReply",
      usePostStaffInfoReply,
      "housingApplication.postStaffInfoReply",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationProviders",
        "timeline.getForStaff",
      ],
    ],
    [
      "useAcceptProviderAsHomePlan",
      useAcceptProviderAsHomePlan,
      "housingApplication.acceptProviderAsHomePlan",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
        "housingApplication.getStaffApplicationProviders",
        "housingApplication.getStaffHomePlan",
        "timeline.getForStaff",
      ],
    ],
    [
      "useSetManualAddressHomePlan",
      useSetManualAddressHomePlan,
      "housingApplication.setManualAddressHomePlan",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
        "housingApplication.getStaffApplicationProviders",
        "housingApplication.getStaffHomePlan",
        "timeline.getForStaff",
      ],
    ],
    [
      "useSetHomePlanApprovals",
      useSetHomePlanApprovals,
      "housingApplication.setHomePlanApprovals",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
        "housingApplication.getStaffHomePlan",
        "timeline.getForStaff",
      ],
    ],
    [
      "useToggleStaffHomePlanReleaseTask",
      useToggleStaffHomePlanReleaseTask,
      "housingApplication.toggleStaffHomePlanReleaseTask",
      "onSettled",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
        "housingApplication.getStaffHomePlan",
        "timeline.getForStaff",
      ],
    ],
    [
      "useToggleProviderHomePlanReleaseTask",
      useToggleProviderHomePlanReleaseTask,
      "housingApplication.toggleProviderHomePlanReleaseTask",
      "onSettled",
      [
        "housingApplication.getProviderApplicationById",
        "housingApplication.getProviderApplications",
        "housingApplication.getProviderHomePlan",
        "timeline.getForProvider",
      ],
    ],
    [
      "useUpdateHomePlanReleaseTaskDetail",
      useUpdateHomePlanReleaseTaskDetail,
      "housingApplication.updateHomePlanReleaseTaskDetail",
      "onSettled",
      [
        "housingApplication.getProviderHomePlan",
        "housingApplication.getStaffHomePlan",
        "timeline.getForStaff",
      ],
    ],
    [
      "useAdvanceApplicationStage",
      useAdvanceApplicationStage,
      "housingApplication.advanceStage",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
        "housingApplication.getStaffApplicationProviders",
        "housingApplication.getStaffHomePlan",
        "timeline.getForStaff",
      ],
    ],
    [
      "useDuplicateHousingApplication",
      useDuplicateHousingApplication,
      "housingApplication.duplicate",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
      ],
    ],
    [
      "useAcknowledgeApprovalRevoked",
      useAcknowledgeApprovalRevoked,
      "housingApplication.acknowledgeApprovalRevoked",
      "onSuccess",
      [
        "housingApplication.getByStaff",
        "housingApplication.getStaffApplicationById",
      ],
    ],
    [
      "useToggleEligibleProviderSelection",
      useToggleEligibleProviderSelection,
      "housingApplication.toggleEligibleProviderSelection",
      "onSuccess",
      ["housingApplication.getStaffApplicationById"],
    ],
    [
      "useUpdateProviderLocation",
      useUpdateProviderLocation,
      "housingApplication.updateProviderLocation",
      "onSettled",
      ["housingApplication.getProviderDetails"],
    ],
  ])(
    "%s invalidates exactly its documented set",
    (_name, hook, path, callback, expected) => {
      expect(invalidationsFor(hook, path, callback)).toEqual(expected.sort());
    },
  );

  it("scopes the id-bearing invalidations to the application that changed", () => {
    invalidationsFor(
      useSetHomePlanApprovals,
      "housingApplication.setHomePlanApprovals",
      "onSuccess",
      { applicationId: "app-42" },
    );

    const scoped = double.invalidations.filter(
      (entry) => entry.input !== undefined,
    );
    expect(scoped.length).toBeGreaterThan(0);
    for (const entry of scoped) {
      expect(entry.input).toEqual({ applicationId: "app-42" });
    }
  });

  it("keys submitDraft's detail invalidation on `id`, the field that mutation sends", () => {
    invalidationsFor(
      useSubmitDraftHousingApplication,
      "housingApplication.submitDraft",
      "onSuccess",
      { id: "app-7" },
    );

    expect(
      double.invalidations.find(
        (entry) => entry.path === "housingApplication.getStaffApplicationById",
      )?.input,
    ).toEqual({ applicationId: "app-7" });
  });

  it("takes advanceStage's application id from the response, not the request", () => {
    // advanceStage is called with more than an application id; the id it
    // invalidates on comes back in the result.
    renderHook(() => useAdvanceApplicationStage());
    const onSuccess = double.mutation("housingApplication.advanceStage")
      .options["onSuccess"] as (data: unknown) => void;

    onSuccess({ applicationId: "app-99" });

    const scoped = double.invalidations.filter(
      (entry) => entry.input !== undefined,
    );
    for (const entry of scoped) {
      expect(entry.input).toEqual({ applicationId: "app-99" });
    }
  });

  describe("useSubmitProviderResponse", () => {
    it("refreshes the provider's own views on any response", () => {
      expect(
        invalidationsFor(
          useSubmitProviderResponse,
          "housingApplication.submitProviderResponse",
          "onSuccess",
          {
            applicationId: APPLICATION_ID,
            response: PROVIDER_RESPONSE_TYPE.DECLINE,
          },
        ),
      ).toEqual([
        "housingApplication.getProviderApplicationById",
        "housingApplication.getProviderApplications",
        "timeline.getForProvider",
      ]);
    });

    it("also refreshes the info request when the response asks for information", () => {
      expect(
        invalidationsFor(
          useSubmitProviderResponse,
          "housingApplication.submitProviderResponse",
          "onSuccess",
          {
            applicationId: APPLICATION_ID,
            response: PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
          },
        ),
      ).toEqual([
        "housingApplication.getProviderApplicationById",
        "housingApplication.getProviderApplications",
        "housingApplication.getProviderInfoRequest",
        "timeline.getForProvider",
      ]);
    });

    it("leaves the info request alone on a conditional approval", () => {
      const paths = invalidationsFor(
        useSubmitProviderResponse,
        "housingApplication.submitProviderResponse",
        "onSuccess",
        {
          applicationId: APPLICATION_ID,
          response: PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
        },
      );

      expect(paths).not.toContain("housingApplication.getProviderInfoRequest");
    });
  });
});

describe("housingApplication error handling", () => {
  it.each([
    [
      "useUpdateHousingApplication",
      useUpdateHousingApplication,
      "housingApplication.update",
    ],
    [
      "useDuplicateHousingApplication",
      useDuplicateHousingApplication,
      "housingApplication.duplicate",
    ],
    [
      "useToggleEligibleProviderSelection",
      useToggleEligibleProviderSelection,
      "housingApplication.toggleEligibleProviderSelection",
    ],
    [
      "useSubmitProviderResponse",
      useSubmitProviderResponse,
      "housingApplication.submitProviderResponse",
    ],
  ])("%s opts out of the global error toast", (_name, hook, path) => {
    renderHook(() => hook());

    expect(double.mutation(path).options["meta"]).toEqual({
      suppressGlobalError: true,
    });
  });

  it("toasts its own message when a release task detail fails to save", () => {
    renderHook(() => useUpdateHomePlanReleaseTaskDetail());
    const onError = double.mutation(
      "housingApplication.updateHomePlanReleaseTaskDetail",
    ).options["onError"] as () => void;

    onError();

    expect(toastErrorMock).toHaveBeenCalledWith(
      "Failed to save release task details.",
      { id: "Failed to save release task details." },
    );
  });

  it("toasts when an optimistic location save fails", () => {
    renderHook(() => useUpdateProviderLocation());
    const onError = double.mutation("housingApplication.updateProviderLocation")
      .options["onError"] as (...args: unknown[]) => void;

    onError(new Error("boom"), {}, undefined);

    expect(toastErrorMock).toHaveBeenCalledWith("Failed to save location.", {
      id: "Failed to save location.",
    });
  });

  describe("a failed provider response", () => {
    const submitOnError = () => {
      renderHook(() => useSubmitProviderResponse());
      return double.mutation("housingApplication.submitProviderResponse")
        .options["onError"] as (...args: unknown[]) => void;
    };

    it("toasts the mapped message and re-reads the application", () => {
      submitOnError()(trpcError("NOT_FOUND", "gone"), {
        applicationId: APPLICATION_ID,
      });

      expect(toastErrorMock).toHaveBeenCalledWith(
        "This application is no longer available to your organization.",
        { id: "This application is no longer available to your organization." },
      );
      // The rejection may mean the application moved on, so both provider
      // views are re-read to show its real state.
      expect(double.invalidatedPaths().sort()).toEqual([
        "housingApplication.getProviderApplicationById",
        "housingApplication.getProviderApplications",
      ]);
    });
  });

  it("toasts its own message when a provider selection fails to save", () => {
    renderHook(() => useToggleEligibleProviderSelection());
    const onError = double.mutation(
      "housingApplication.toggleEligibleProviderSelection",
    ).options["onError"] as () => void;

    onError();

    expect(toastErrorMock).toHaveBeenCalledWith(
      "Failed to update provider selection.",
      { id: "Failed to update provider selection." },
    );
  });

  it("wires the optimistic toggle onto both release-task mutations", () => {
    // The rollback logic itself is covered in utils/optimisticReleaseTasks;
    // this asserts each mutation actually has it attached.
    renderHook(() => useToggleStaffHomePlanReleaseTask());
    renderHook(() => useToggleProviderHomePlanReleaseTask());

    for (const path of [
      "housingApplication.toggleStaffHomePlanReleaseTask",
      "housingApplication.toggleProviderHomePlanReleaseTask",
    ]) {
      const { options } = double.mutation(path);
      expect(options["onMutate"]).toBeTypeOf("function");
      expect(options["onError"]).toBeTypeOf("function");
    }
  });

  it("registers the extraction mutation with no cache work of its own", () => {
    renderHook(() => useExtractContent());

    expect(double.mutation("vertex.extractWithVertexAI").options).toEqual({});
  });
});
