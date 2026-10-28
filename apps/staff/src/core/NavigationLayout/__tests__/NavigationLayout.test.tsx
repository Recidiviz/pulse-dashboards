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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import {
  useFeatureVariants,
  useRootStore,
  useUserStore,
} from "../../../components/StoreProvider";
import useIsMobile from "../../../hooks/useIsMobile";
import useLogout from "../../../hooks/useLogout";
import { useCoreStore } from "../../CoreStoreProvider";
import { NavigationLayout } from "..";

vi.mock("../../../components/StoreProvider");
vi.mock("../../CoreStoreProvider");
vi.mock("../../../hooks/useIsMobile");
vi.mock("../../../hooks/useLogout");

const useFeatureVariantsMock = vi.mocked(useFeatureVariants);

beforeEach(() => {
  vi.mocked(useIsMobile).mockReturnValue({ isMobile: false });
  vi.mocked(useLogout).mockReturnValue(vi.fn());
  vi.mocked(useUserStore).mockReturnValue({
    user: { name: "Test" },
  } as never);
  vi.mocked(useCoreStore).mockReturnValue({} as never);
  vi.mocked(useRootStore).mockReturnValue({
    currentTenantId: "US_ID",
    userStore: {
      userAllowedNavigation: {},
      isRecidivizUser: false,
      getRoutePermission: () => false,
    },
    tenantStore: {},
    sentencingStore: {},
    workflowsStore: { homepage: "home" },
    analyticsStore: {},
  } as never);
  useFeatureVariantsMock.mockReturnValue({});
});

// The menu items only render once the profile dropdown is open.
async function renderAndOpenProfileMenu() {
  render(
    <MemoryRouter>
      <NavigationLayout />
    </MemoryRouter>,
  );
  await userEvent.click(
    screen.getByRole("menuitem", { name: "Profile dropdown button" }),
  );
}

// DropdownMenuItem wraps each link in its own role="menuitem" button, so a
// role query matches both; select the anchor itself instead.
function getHousingLink() {
  return screen.getByText("Transitional Housing").closest("a");
}

describe("the Transitional Housing link", () => {
  it("is hidden without the usIdTransitionalHousingPilot feature variant", async () => {
    await renderAndOpenProfileMenu();

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.queryByText("Transitional Housing")).not.toBeInTheDocument();
  });

  it.each([
    { env: "production", href: "https://housing.recidiviz.org" },
    { env: "staging", href: "https://housing-stg.recidiviz.org" },
    { env: "dev", href: "https://housing-stg.recidiviz.org" },
  ])("links to $href in $env", async ({ env, href }) => {
    vi.stubEnv("VITE_DEPLOY_ENV", env);
    useFeatureVariantsMock.mockReturnValue({
      usIdTransitionalHousingPilot: {},
    });

    await renderAndOpenProfileMenu();

    const link = getHousingLink();
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
