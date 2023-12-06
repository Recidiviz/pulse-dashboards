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
import { render } from "@testing-library/react";
import { useLocation } from "react-router-dom";

import { useRootStore } from "../components/StoreProvider";
import ProtectedRoute from "../ProtectedRoute";

jest.mock("../components/StoreProvider");
jest.mock("react-router-dom", () => ({
  useLocation: jest.fn(),
}));

const mockUseRootStore = useRootStore as jest.Mock;

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders children when the path is allowed", () => {
    (useLocation as jest.Mock).mockReturnValue({
      pathname: "/workflows",
    });
    mockUseRootStore.mockReturnValue({
      userStore: {
        userAllowedNavigation: { workflows: [] },
      },
    });

    const { getByText } = render(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>
    );

    expect(getByText("Content")).toBeInTheDocument();
  });

  it("renders NotFound component when the path is not allowed", () => {
    (useLocation as jest.Mock).mockReturnValue({
      pathname: "/pathways",
    });
    mockUseRootStore.mockReturnValue({
      userStore: {
        userAllowedNavigation: { workflows: [] },
      },
    });

    const { getByText } = render(
      <ProtectedRoute>
        <div>Child Component</div>
      </ProtectedRoute>
    );

    expect(getByText("Oops Page Not Found")).toBeInTheDocument();
  });
});
