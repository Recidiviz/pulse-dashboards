/* eslint-disable react/no-unknown-property */
// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { Loading } from "@recidiviz/design-system";
import React from "react";

import mockWithTestId from "../../../__helpers__/mockWithTestId";
import { useRootStore } from "../../components/StoreProvider";
import { render } from "../../testUtils";
import AuthWall from "../AuthWall";

jest.mock("../../components/StoreProvider");
jest.mock("@recidiviz/design-system");
const LoadingMock = Loading as jest.Mock;
jest.mock("react-router-dom", () => ({
  useLocation: jest.fn().mockReturnValue({
    pathname: "/community/revocations",
  }),
  useHistory: jest.fn().mockReturnValue({
    replace: jest.fn(),
  }),
}));

const mockLoadingTestId = "loading-test-id";
LoadingMock.mockReturnValue(mockWithTestId(mockLoadingTestId));

let userStore: any;
const authErrorMock = jest.fn();

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation();
  jest.clearAllMocks();
  userStore = {
    user: {},
    allowedSupervisionLocationIds: [],
    userIsLoading: false,
    isAuthorized: true,
    availableStateCodes: ["US_MO"],
    authError: undefined,
    userAppMetadata: {},
    setAuthError: authErrorMock,
  };
});

afterAll(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

test("shows loading component when userIsLoading", () => {
  userStore.userIsLoading = true;

  (useRootStore as jest.Mock).mockReturnValue({
    userStore,
    currentTenantId: "US_MO",
  });
  const { getByTestId } = render(<AuthWall />);
  expect(getByTestId(mockLoadingTestId)).toBeInTheDocument();
});

test("renders children when can_access_leadership_dashboard property does not exist", () => {
  (useRootStore as jest.Mock).mockReturnValue({
    userStore,
    currentTenantId: "US_MO",
  });
  const { getByText } = render(
    <AuthWall>
      {/* @ts-ignore */}
      <div tenantIds={["US_MO"]} views={["community"]}>
        AUTHORIZED
      </div>
    </AuthWall>
  );
  expect(getByText("AUTHORIZED")).toBeInTheDocument();
});

test("returns Not Found when the pathname is not in the layout views", () => {
  (useRootStore as jest.Mock).mockReturnValue({
    userStore,
    currentTenantId: "US_MO",
  });
  const { getByText } = render(
    <AuthWall>
      {/* @ts-ignore */}
      <div tenantIds={["US_MO"]} views={["anyOtherView"]}>
        AUTHORIZED
      </div>
    </AuthWall>
  );
  expect(getByText("Oops Page Not Found")).toBeInTheDocument();
});
