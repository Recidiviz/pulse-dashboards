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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { getItem, saveItem } from "~@meetings/app/shared/lib/storage";
import { type AgencyConfig, AgencyConfigSchema } from "~@meetings/config";

import { stateCodeParam } from "./stateCodeParam";
import {
  DEFAULT_STATE_CODE,
  StateCodeProvider,
  useStateSelection,
} from "./StateContext";

jest.mock("~@meetings/app/shared/lib/storage", () => ({
  getItem: jest.fn(),
  saveItem: jest.fn(),
}));

const mockGetItem = getItem as jest.Mock;
const mockSaveItem = saveItem as jest.Mock;

const makeConfig = (stateCode: string, name: string): AgencyConfig =>
  AgencyConfigSchema.parse({ stateCode, name, labels: {} });

const agencyConfigs: Record<string, AgencyConfig> = {
  US_NE: makeConfig("US_NE", "Nebraska"),
  US_DEMO: makeConfig("US_DEMO", "Demo"),
};

const baseProps = {
  isSkipAuthUser: false,
  userStateCode: "US_NE",
  recidivizAllowedStates: ["US_NE"],
  agencyConfigs,
  configsPending: false,
  configsErrored: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue(null);
  stateCodeParam.current = "";
});

function makeWrapper(
  selectedStateRef: React.RefObject<string | null>,
  props: Partial<typeof baseProps> = {},
  queryClient = new QueryClient(),
) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <StateCodeProvider
        selectedStateRef={selectedStateRef}
        {...baseProps}
        {...props}
      >
        {children}
      </StateCodeProvider>
    </QueryClientProvider>
  );
}

describe("StateCodeProvider", () => {
  describe("selectedStateRef initialization", () => {
    it("sets ref to user state code on first render for a state user", () => {
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "US_NE",
          recidivizAllowedStates: ["US_NE"],
        }),
      });

      expect(ref.current).toBe("US_NE");
    });

    it("sets ref to US_DEMO for a US_DEMO state user", () => {
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "US_DEMO",
          recidivizAllowedStates: ["US_DEMO"],
        }),
      });

      expect(ref.current).toBe("US_DEMO");
    });

    it("normalizes lowercase state code to uppercase", () => {
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "us_ne",
          recidivizAllowedStates: ["us_ne"],
        }),
      });

      expect(ref.current).toBe("US_NE");
    });

    it("keeps default state code for Recidiviz users", () => {
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "recidiviz",
          recidivizAllowedStates: ["US_NE", "US_DEMO", "US_ME"],
        }),
      });

      expect(ref.current).toBe(DEFAULT_STATE_CODE);
    });

    it("keeps default state code for skip auth users", () => {
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "US_NE",
          isSkipAuthUser: true,
          recidivizAllowedStates: [],
        }),
      });

      expect(ref.current).toBe(DEFAULT_STATE_CODE);
    });
  });

  describe("selectedStateCode initial value", () => {
    it("exposes the user state code immediately (before async effect) for state users", () => {
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "US_DEMO",
          recidivizAllowedStates: ["US_DEMO"],
        }),
      });

      expect(result.current.selectedStateCode).toBe("US_DEMO");
    });
  });

  describe("default resolution for Recidiviz users", () => {
    it("resolves to US_DEMO and seeds stateCodeParam when there's no URL param or saved state", async () => {
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "recidiviz",
          recidivizAllowedStates: ["US_NE", "US_DEMO", "US_ME"],
        }),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.selectedStateCode).toBe("US_DEMO");
      expect(stateCodeParam.current).toBe("US_DEMO");
    });
  });

  describe("isLoading", () => {
    it("stays true while agencyConfigs hasn't loaded, without reading storage", () => {
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          agencyConfigs: {},
          configsPending: true,
          userStateCode: "recidiviz",
          recidivizAllowedStates: ["US_NE", "US_DEMO", "US_ME"],
        }),
      });

      // isLoading starts true; the guard must bail before reading storage.
      expect(result.current.isLoading).toBe(true);
      expect(mockGetItem).not.toHaveBeenCalled();
    });

    it("stays true while the config query is retrying after an error, without reading storage", () => {
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          agencyConfigs: {},
          configsErrored: true,
          userStateCode: "recidiviz",
          recidivizAllowedStates: ["US_NE", "US_DEMO", "US_ME"],
        }),
      });

      expect(result.current.isLoading).toBe(true);
      expect(mockGetItem).not.toHaveBeenCalled();
    });

    it("resolves to the default when the config query settles with no configs", async () => {
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          agencyConfigs: {},
          userStateCode: "recidiviz",
          recidivizAllowedStates: ["US_NE", "US_DEMO", "US_ME"],
        }),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.selectedStateCode).toBe(DEFAULT_STATE_CODE);
    });
  });

  describe("URL param validation", () => {
    it("resolves to a valid URL param without overwriting the saved selection", async () => {
      stateCodeParam.current = "US_NE";
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "recidiviz",
          recidivizAllowedStates: ["US_NE", "US_DEMO"],
        }),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.selectedStateCode).toBe("US_NE");
      // The param applies to this session only.
      expect(mockSaveItem).not.toHaveBeenCalledWith(
        "selectedStateCode",
        expect.anything(),
      );
    });

    it("falls back to the saved state when the URL param is not a known agency", async () => {
      stateCodeParam.current = "US_XX";
      mockGetItem.mockImplementation((key: string) =>
        Promise.resolve(key === "selectedStateCode" ? "US_NE" : null),
      );
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "recidiviz",
          recidivizAllowedStates: ["US_NE", "US_DEMO"],
        }),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.selectedStateCode).toBe("US_NE");
      expect(stateCodeParam.current).toBe("US_NE");
    });

    it("ignores a URL param outside the user's allowed states", async () => {
      stateCodeParam.current = "US_NE"; // known agency, but not allowed
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(ref, {
          userStateCode: "recidiviz",
          recidivizAllowedStates: ["US_DEMO"],
        }),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.selectedStateCode).toBe("US_DEMO");
    });
  });

  describe("query cache reset", () => {
    it("resets the query cache when the resolved state differs from the cache's state", async () => {
      mockGetItem.mockImplementation((key: string) =>
        Promise.resolve(key === "queryCacheStateCode" ? "US_NE" : null),
      );
      const queryClient = new QueryClient();
      const resetSpy = jest.spyOn(queryClient, "resetQueries");
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(
          ref,
          {
            userStateCode: "recidiviz",
            recidivizAllowedStates: ["US_NE", "US_DEMO"],
          },
          queryClient,
        ),
      });

      await waitFor(() => expect(resetSpy).toHaveBeenCalled());
      expect(mockSaveItem).toHaveBeenCalledWith(
        "queryCacheStateCode",
        "US_DEMO",
      );
    });

    it("clears the query cache before setSelectedStateCode resolves", async () => {
      const queryClient = new QueryClient();
      const resetSpy = jest.spyOn(queryClient, "resetQueries");
      const ref = React.createRef<string | null>();

      const { result } = renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(
          ref,
          {
            userStateCode: "recidiviz",
            recidivizAllowedStates: ["US_NE", "US_DEMO"],
          },
          queryClient,
        ),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      resetSpy.mockClear();
      mockSaveItem.mockClear();

      // The old state's cache must already be cleared when this resolves.
      await act(() => result.current.setSelectedStateCode("US_NE"));

      expect(resetSpy).toHaveBeenCalled();
      expect(mockSaveItem).toHaveBeenCalledWith("queryCacheStateCode", "US_NE");
    });

    it("does not reset when the cache already matches the resolved state", async () => {
      mockGetItem.mockImplementation((key: string) =>
        Promise.resolve(key === "queryCacheStateCode" ? "US_DEMO" : null),
      );
      const queryClient = new QueryClient();
      const resetSpy = jest.spyOn(queryClient, "resetQueries");
      const ref = React.createRef<string | null>();

      renderHook(() => useStateSelection(), {
        wrapper: makeWrapper(
          ref,
          {
            userStateCode: "recidiviz",
            recidivizAllowedStates: ["US_NE", "US_DEMO"],
          },
          queryClient,
        ),
      });

      await waitFor(() =>
        expect(mockGetItem).toHaveBeenCalledWith("queryCacheStateCode"),
      );
      expect(resetSpy).not.toHaveBeenCalled();
    });
  });
});
