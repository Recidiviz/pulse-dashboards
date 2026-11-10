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
import { Platform } from "react-native";

import { useIsSuccessPlannerVisible } from "./useIsSuccessPlannerVisible";

jest.mock("~@meetings/app/entities/agency-config/@x/success-planner", () => ({
  useCurrentAgencyConfig: () => ({ successPlannerEnabled: true }),
}));

jest.mock("~@meetings/app/entities/user/@x/success-planner", () => ({
  useUserContext: () => ({ isRecidivizUser: true }),
  useFeatureVariants: () => ({ isVariantActive: () => false }),
}));

describe("useIsSuccessPlannerVisible", () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "web");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("is hidden for clients even when the planner is enabled", () => {
    const { result } = renderHook(() => useIsSuccessPlannerVisible(true));
    expect(result.current).toBe(false);
  });

  test("is visible for residents when the planner is enabled", () => {
    const { result } = renderHook(() => useIsSuccessPlannerVisible(false));
    expect(result.current).toBe(true);
  });
});
