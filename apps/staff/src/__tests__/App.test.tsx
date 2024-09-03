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

import { render } from "@testing-library/react";
import { Mock } from "vitest";

import mockWithTestId from "../../__helpers__/mockWithTestId";
import App from "../App";
import ErrorMessage from "../components/ErrorMessage";
import NotFound from "../components/NotFound";
import StoreProvider, { useRootStore } from "../components/StoreProvider";
import VerificationNeeded from "../components/VerificationNeeded";
import ProtectedLayout from "../ProtectedLayout";

// Mock out intercom so it doesn't throw errors during render
vi.mock("@intercom/messenger-js-sdk");
vi.mock("mobx-react-lite", () => {
  return {
    observer: (component: any) => component,
  };
});
vi.mock("../utils/initIntercomSettings");
vi.mock("../utils/i18nSettings");

vi.mock("../ProtectedLayout");
vi.mock("../components/NotFound");

vi.mock("@recidiviz/design-system");
vi.mock("../components/StoreProvider");
vi.mock("../components/ErrorMessage");
vi.mock("../components/VerificationNeeded");

vi.mock("../InsightsStore/presenters/SwarmPresenter/getSwarmLayoutWorker");

const ProtectedLayoutMock = ProtectedLayout as unknown as Mock;

describe("App tests", () => {
  const mockNotFoundId = "not-found-id";
  const mockErrorId = "error-test-id";
  const mockVerificationNeededId = "verification-needed-test-id";

  beforeEach(() => {
    (StoreProvider as Mock).mockImplementation(({ children }) => children);
    ProtectedLayoutMock.mockReturnValue(() => <div>Protected Layout</div>);

    (NotFound as Mock).mockReturnValue(mockWithTestId(mockNotFoundId));
    (ErrorMessage as unknown as Mock).mockReturnValue(
      mockWithTestId(mockErrorId),
    );
    (VerificationNeeded as Mock).mockReturnValue(
      mockWithTestId(mockVerificationNeededId),
    );
  });

  it("should render the Error component if there is an error", () => {
    window.history.pushState({}, "", "/");

    ProtectedLayoutMock.mockImplementation(() => {
      throw Error("test error");
    });

    // do not log the expected error - keep tests less verbose
    vi.spyOn(console, "error").mockImplementation(() => null);
    vi.spyOn(console, "log").mockImplementation(() => null);
    const { getByTestId } = render(<App />);

    expect(getByTestId(mockErrorId)).toBeInTheDocument();
  });

  it("should render the Verification Needed component", () => {
    window.history.pushState({}, "", "/verify");
    (useRootStore as Mock).mockReturnValue({
      userStore: { user: {}, isAuthorized: true },
    });

    const { container, getByTestId } = render(<App />);

    expect(container.children.length).toBe(2);
    expect(getByTestId(mockVerificationNeededId)).toBeInTheDocument();
  });
});
