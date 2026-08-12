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

import { renderHook } from "@testing-library/react-native";
import React from "react";

import {
  DEFAULT_STATE_CODE,
  StateCodeProvider,
  useStateSelection,
} from "./StateContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const agencyConfigs = {
  US_NE: { stateCode: "US_NE", name: "Nebraska", version: 1, baseVersion: 1 },
  US_DEMO: { stateCode: "US_DEMO", name: "Demo", version: 1, baseVersion: 1 },
} as never;

const baseProps = {
  isSkipAuthUser: false,
  userStateCode: "US_NE",
  recidivizAllowedStates: ["US_NE"],
  agencyConfigs,
};

function makeWrapper(
  selectedStateRef: React.RefObject<string | null>,
  props: Partial<typeof baseProps> = {},
) {
  return ({ children }: { children: React.ReactNode }) => (
    <StateCodeProvider
      selectedStateRef={selectedStateRef}
      {...baseProps}
      {...props}
    >
      {children}
    </StateCodeProvider>
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
});
