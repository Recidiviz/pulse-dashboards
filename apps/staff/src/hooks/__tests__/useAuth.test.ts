// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { useLocation, useNavigate } from "react-router-dom";
import { Mock } from "vitest";
import { expect } from "vitest";

import { useRootStore } from "../../components/StoreProvider";
import useAuth from "../useAuth";

vi.mock("react-idle-timer");
vi.mock("../../components/StoreProvider");
vi.mock("react-router-dom");
const authErrorMock = vi.fn();

let userStore: any;

const mockUseRootStore = useRootStore as Mock;
const mockUseLocation = useLocation as Mock;
const mockUseNavigate = useNavigate as Mock;

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userStore = {
      user: {},
      userIsLoading: false,
      isAuthorized: true,
      authError: undefined,
      userAppMetadata: {
        stateCode: "US_XX",
      },
      setAuthError: authErrorMock,
    };
    mockUseLocation.mockReturnValue({
      pathname: "/",
    });
    mockUseNavigate.mockReturnValue(vi.fn());
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("throws an error when the userStore has an error", () => {
    const authError = new Error("Testing error");
    mockUseRootStore.mockReturnValue({
      userStore: {
        ...userStore,
        authError,
      },
      tenantStore: {
        currentTenantId: undefined,
        tenantConfigs: {},
      },
    });

    expect(() => renderHook(() => useAuth())).toThrowError(authError);
  });

  it("preserves query params and hash when navigating after login", () => {
    const navigateSpy = vi.fn();
    mockUseNavigate.mockReturnValue(navigateSpy);
    mockUseRootStore.mockReturnValue({
      userStore: {
        ...userStore,
        isAuthorized: false,
        authorize: (handleTargetUrl: (targetUrl: string) => void) =>
          handleTargetUrl(
            "https://app.example.com/workflows?stateCode=US_TN&clientId=abc#section",
          ),
      },
      tenantStore: {
        currentTenantId: undefined,
        tenantConfigs: {},
      },
    });

    renderHook(() => useAuth());

    expect(navigateSpy).toHaveBeenCalledWith(
      "/workflows?stateCode=US_TN&clientId=abc#section",
      { replace: true },
    );
  });

  it("sets the currentTenantId for recidiviz users with a state code param", () => {
    mockUseLocation.mockReturnValue({
      search: "?stateCode=US_TN",
    });
    mockUseRootStore.mockReturnValue({
      userStore: {
        ...userStore,
        stateCode: "RECIDIVIZ",
      },
      tenantStore: {
        setCurrentTenantId: vi.fn(),
      },
    });
    renderHook(() => useAuth());
    expect(
      mockUseRootStore().tenantStore.setCurrentTenantId,
    ).toHaveBeenCalledExactlyOnceWith("US_TN");
  });
});
