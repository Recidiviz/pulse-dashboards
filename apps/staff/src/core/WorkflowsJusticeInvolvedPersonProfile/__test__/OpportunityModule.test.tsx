// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { BrowserRouter, useLocation } from "react-router-dom";
import { Mock } from "vitest";

import { useFeatureVariants } from "../../../components/StoreProvider";
import { mockOpportunity } from "../../__tests__/testUtils";
import { OpportunityModule } from "../OpportunityModule";

vi.mock("../../../components/StoreProvider");
const useFeatureVariantsMock = useFeatureVariants as Mock;

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useLocation: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

test.each([
  ["workflows", "/workflows/home", true],
  ["insights", "/insights/supervision", false],
])(
  "set last viewed from %s path",
  (testName: string, path: string, shouldCallSetLastViewed: boolean) => {
    useFeatureVariantsMock.mockReturnValue({});
    vi.mocked(useLocation, { partial: true }).mockReturnValue({
      pathname: path,
    });
    const setLastViewedSpy = vi.spyOn(mockOpportunity, "setLastViewed");

    render(
      <BrowserRouter>
        <OpportunityModule opportunity={mockOpportunity} isVisible />
      </BrowserRouter>,
    );

    expect(setLastViewedSpy).toHaveBeenCalledTimes(
      shouldCallSetLastViewed ? 1 : 0,
    );
  },
);
