// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { useLocation } from "react-router-dom";

import { useRootStore } from "../../components/StoreProvider";
import useAuth from "../useAuth";

jest.mock("react-idle-timer");
jest.mock("../../components/StoreProvider");
jest.mock("react-router-dom");
const authErrorMock = jest.fn();

let userStore: any;

const mockUseRootStore = useRootStore as jest.Mock;
const mockUseLocation = useLocation as jest.Mock;

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("throws an error when the userStore has an error", () => {
    const authError = new Error("Testing error");
    mockUseRootStore.mockReturnValue({
      userStore: {
        ...userStore,
        authError,
      },
    });

    expect(() => renderHook(() => useAuth())).toThrowError(authError);
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
        setCurrentTenantId: jest.fn(),
      },
    });
    renderHook(() => useAuth());
    expect(
      mockUseRootStore().tenantStore.setCurrentTenantId,
    ).toHaveBeenCalledOnceWith("US_TN");
  });
});
