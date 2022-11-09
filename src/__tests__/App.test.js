// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2019 Recidiviz, Inc.
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
import { render } from "@testing-library/react";
import React from "react";

import mockWithTestId from "../../__helpers__/mockWithTestId";
import App from "../App";
import ErrorMessage from "../components/ErrorMessage";
import NotFound from "../components/NotFound";
import StoreProvider, { useRootStore } from "../components/StoreProvider";
import VerificationNeeded from "../components/VerificationNeeded";
import MethodologyPathways from "../core/MethodologyPathways";
import MethodologyProjections from "../core/MethodologyProjections/Methodology";
import PageSystem from "../core/PageSystem";
import PageVitals from "../core/PageVitals";
import PathwaysLayout from "../core/PathwaysLayout";
import LanternLayout from "../lantern/LanternLayout";
import Revocations from "../lantern/Revocations";
import { US_MO, US_PA } from "../RootStore/TenantStore/lanternTenants";
import { US_ID } from "../RootStore/TenantStore/pathwaysTenants";

const METADATA_NAMESPACE = process.env.REACT_APP_METADATA_NAMESPACE;

jest.mock("../utils/initIntercomSettings");
jest.mock("../utils/i18nSettings");
jest.mock("../lantern/LanternLayout");
jest.mock("../lantern/Revocations");
jest.mock("../core/PathwaysLayout");
jest.mock("../components/NotFound");
jest.mock("@recidiviz/design-system");
jest.mock("../components/StoreProvider");
jest.mock("../components/ErrorMessage");
jest.mock("../components/VerificationNeeded");
jest.mock("../core/MethodologyProjections/Methodology");
jest.mock("../core/MethodologyPathways");
jest.mock("../core/PageVitals");
jest.mock("../core/PageSystem");

describe("App tests", () => {
  const metadataField = `${METADATA_NAMESPACE}app_metadata`;

  const mockRevocationsId = "mo-community-revocations-id";
  const mockNotFoundId = "not-found-id";
  const mockLoadingTestId = "loading-test-id";
  const mockErrorId = "error-test-id";
  const mockVerificationNeededId = "verification-needed-test-id";
  const mockMethodologyProjectionsId = "projections-methodology-id";
  const mockMethodologyPathwaysId = "pathways-methodology-id";
  const mockPathwaysPrisonId = "pathways-prison-id";
  const mockOperationsId = "operations-id";

  const RevocationsMock = Revocations.type;
  const LanternLayoutMock = LanternLayout.type;
  const PathwaysLayoutMock = PathwaysLayout.type;
  const MethodologyPathwaysMock = MethodologyPathways.type;
  const PageSystemMock = PageSystem.type;
  const PageVitalsMock = PageVitals.type;
  let userStore = {};

  LanternLayoutMock.mockImplementation(({ children }) => children);
  PathwaysLayoutMock.mockImplementation(({ children }) => children);
  StoreProvider.mockImplementation(({ children }) => children);
  RevocationsMock.mockReturnValue(mockWithTestId(mockRevocationsId));
  PageSystemMock.mockReturnValue(mockWithTestId(mockPathwaysPrisonId));
  PageVitalsMock.mockReturnValue(mockWithTestId(mockOperationsId));
  NotFound.mockReturnValue(mockWithTestId(mockNotFoundId));
  Loading.mockReturnValue(mockWithTestId(mockLoadingTestId));
  ErrorMessage.mockReturnValue(mockWithTestId(mockErrorId));
  VerificationNeeded.mockReturnValue(mockWithTestId(mockVerificationNeededId));
  MethodologyProjections.mockReturnValue(
    mockWithTestId(mockMethodologyProjectionsId)
  );
  MethodologyPathwaysMock.mockReturnValue(
    mockWithTestId(mockMethodologyPathwaysId)
  );

  beforeEach(() => {
    jest.clearAllMocks();
    userStore = {
      isAuthorized: true,
      userAppMetadata: { can_access_leadership_dashboard: true },
      userAllowedNavigation: {
        methodology: ["projections"],
        system: ["prison"],
        "id-methodology": ["operations", "system"],
      },
    };
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("LanternLayout", () => {
    it("should render MO Layout with Revocations page", () => {
      window.history.pushState({}, "", "/community/revocations");
      const user = { [metadataField]: { state_code: US_MO } };

      useRootStore.mockReturnValue({
        userStore: { ...userStore, ...user, stateCode: US_MO },
        currentTenantId: US_MO,
      });

      const { getByTestId } = render(<App />);

      expect(LanternLayoutMock).toHaveBeenCalledTimes(1);
      expect(PathwaysLayoutMock).toHaveBeenCalledTimes(0);
      expect(getByTestId(mockRevocationsId)).toBeInTheDocument();
    });

    it("should render PA Layout with Revocations page", () => {
      window.history.pushState({}, "", "/community/revocations");
      const user = { [metadataField]: { state_code: US_PA } };
      useRootStore.mockReturnValue({
        userStore: { ...userStore, ...user },
        currentTenantId: US_PA,
      });

      const { getByTestId } = render(<App />);

      expect(LanternLayoutMock).toHaveBeenCalledTimes(1);
      expect(PathwaysLayoutMock).toHaveBeenCalledTimes(0);
      expect(getByTestId(mockRevocationsId)).toBeInTheDocument();
    });
  });

  describe("Pathways layout", () => {
    it("should render Pathways Layout for a ID user with system prison page", () => {
      window.history.pushState({}, "", "/system/prison");
      const user = { [metadataField]: { state_code: US_ID } };

      useRootStore.mockReturnValue({
        userStore: { ...userStore, ...user, stateCode: US_ID },
        currentTenantId: US_ID,
      });

      const { getByTestId } = render(<App />);
      expect(PathwaysLayoutMock).toHaveBeenCalledTimes(1);
      expect(LanternLayoutMock).toHaveBeenCalledTimes(0);
      expect(getByTestId(mockPathwaysPrisonId)).toBeInTheDocument();
    });
  });

  describe("Not Found page", () => {
    it("should be rendered given an incorrect path", () => {
      window.history.pushState({}, "", "/some/page");
      useRootStore.mockReturnValue({
        userStore: { ...userStore, user: {} },
        currentTenantId: US_PA,
      });

      const { container, getByTestId } = render(<App />);

      expect(container.children.length).toBe(1);
      expect(getByTestId(mockNotFoundId)).toBeInTheDocument();
    });

    it("should be rendered when the currentTenantId is not authorized for a layout", () => {
      window.history.pushState({}, "", "/some/page");
      useRootStore.mockReturnValue({
        userStore: { ...userStore, user: {} },
        currentTenantId: "US_XX",
      });

      const { container, getByTestId } = render(<App />);

      expect(container.children.length).toBe(1);
      expect(getByTestId(mockNotFoundId)).toBeInTheDocument();
    });

    it("should be rendered when the path and the layout views do not match", () => {
      window.history.pushState({}, "", "/some-other-view");
      const user = { [metadataField]: { state_code: US_ID } };

      useRootStore.mockReturnValue({
        userStore: { ...userStore, ...user },
        currentTenantId: US_ID,
      });

      const { getByTestId, container } = render(<App />);
      expect(container.children.length).toBe(1);
      expect(PathwaysLayoutMock).toHaveBeenCalledTimes(0);
      expect(LanternLayoutMock).toHaveBeenCalledTimes(0);
      expect(getByTestId(mockNotFoundId)).toBeInTheDocument();
    });
  });

  describe("id-methodology page", () => {
    it("should render the system methodology page for System", () => {
      window.history.pushState({}, "", "/id-methodology/system");
      const user = { [metadataField]: { state_code: US_ID } };

      useRootStore.mockReturnValue({
        userStore: { ...userStore, ...user, stateCode: US_ID },
        currentTenantId: US_ID,
      });

      const { container, getByTestId } = render(<App />);

      expect(PathwaysLayoutMock).toHaveBeenCalledTimes(1);
      expect(container.children.length).toBe(1);
      expect(getByTestId(mockMethodologyPathwaysId)).toBeInTheDocument();
    });

    it("should render the system methodology page for Operations", () => {
      window.history.pushState({}, "", "/id-methodology/operations");
      const user = { [metadataField]: { state_code: US_ID } };

      useRootStore.mockReturnValue({
        userStore: { ...userStore, ...user, stateCode: US_ID },
        currentTenantId: US_ID,
      });

      const { container, getByTestId } = render(<App />);

      expect(PathwaysLayoutMock).toHaveBeenCalledTimes(1);
      expect(container.children.length).toBe(1);
      expect(getByTestId(mockMethodologyPathwaysId)).toBeInTheDocument();
    });
  });

  it("should render Loading component while user is loading", () => {
    useRootStore.mockReturnValue({
      userStore: { user: {}, userIsLoading: true, authorize: () => {} },
    });

    const { container } = render(<App />);

    expect(container.children.length).toBe(1);
    expect(container.firstChild.className).toBe("Loading__container");
  });

  it("should render the Error component if there is an error", () => {
    useRootStore.mockReturnValue({
      userStore: { userIsLoading: false, authError: true },
    });

    // do not log the expected error - keep tests less verbose
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    const { getByTestId } = render(<App />);

    expect(getByTestId(mockErrorId)).toBeInTheDocument();
  });

  it("should render the Verification Needed component", () => {
    window.history.pushState({}, "", "/verify");
    useRootStore.mockReturnValue({
      userStore: { user: {}, isAuthorized: true },
      currentTenantId: US_PA,
    });

    const { container, getByTestId } = render(<App />);

    expect(container.children.length).toBe(1);
    expect(getByTestId(mockVerificationNeededId)).toBeInTheDocument();
  });
});
