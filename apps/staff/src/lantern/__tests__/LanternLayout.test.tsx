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

import mockWithTestId from "../../../__helpers__/mockWithTestId";
import IE11Banner from "../../components/IE11Banner";
import NotFound from "../../components/NotFound";
import { useRootStore, useUserStore } from "../../components/StoreProvider";
import useIntercom from "../../hooks/useIntercom";
import LanternLayout from "../LanternLayout";
import LanternTopBar from "../LanternTopBar";
import Revocations from "../Revocations";

vi.mock("react-router-dom");
vi.mock("mobx-react-lite", () => {
  return {
    observer: (component: any) => component,
  };
});
vi.mock("../../components/StoreProvider", () => ({
  useRootStore: vi.fn(),
  useUserStore: vi.fn(),
}));
vi.mock("../../hooks/useIntercom");
vi.mock("../../utils/i18nSettings");
vi.mock("../Revocations");
vi.mock("../../components/NotFound");
vi.mock("../../components/IE11Banner");
vi.mock("../LanternTopBar");

const mockUseRootStore = useRootStore as Mock;
const mockUseUserStore = useUserStore as Mock;

describe("LanternLayout tests", () => {
  beforeEach(() => {
    (NotFound as Mock).mockReturnValue(mockWithTestId("not-found-id"));
    (Revocations as unknown as Mock).mockReturnValue(
      mockWithTestId("revocations-id"),
    );
    (IE11Banner as Mock).mockReturnValue(mockWithTestId("ie11-banner"));
    (LanternTopBar as Mock).mockReturnValue(null);
    mockUseRootStore.mockReturnValue({
      currentTenantId: "US_PA",
      pageStore: {},
    });
    mockUseUserStore.mockReturnValue({
      userAllowedNavigation: {
        revocations: [],
      },
    });
  });

  it("should render Revocations for lantern tenants", async () => {
    const { getByTestId } = render(<LanternLayout />);
    expect(getByTestId("revocations-id")).toBeInTheDocument();
  });

  it("should render NotFound if tenantId is invalid", () => {
    mockUseRootStore.mockReturnValue({
      currentTenantId: "US_XX",
      pageStore: {},
    });
    const { getByTestId } = render(<LanternLayout />);
    expect(getByTestId("not-found-id")).toBeInTheDocument();
  });

  it("should render NotFound if revocations not in allowed navigation", () => {
    mockUseUserStore.mockReturnValue({
      userAllowedNavigation: {
        workflows: ["home"],
      },
    });
    const { getByTestId } = render(<LanternLayout />);
    expect(getByTestId("not-found-id")).toBeInTheDocument();
  });

  it("should use Intercom for Lantern layout", () => {
    render(<LanternLayout />);
    expect(useIntercom).toHaveBeenCalled();
  });
});
