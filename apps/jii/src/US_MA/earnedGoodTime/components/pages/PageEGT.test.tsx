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

import { screen, waitFor } from "@testing-library/react";
import { formatISO } from "date-fns";
import { axe } from "jest-axe";

import {
  mockAuthorized,
  renderAtRoute,
} from "../../../../common/components/pages/testUtils";
import { State } from "../../../../routes/routes";

let container: HTMLElement;
let mockAuth: ReturnType<typeof mockAuthorized>;

describe("onboarding already seen", () => {
  beforeEach(() => {
    mockAuth = mockAuthorized({ stateCode: "US_MA" });
    vi.spyOn(
      mockAuth.rootStore.userStore,
      "getUserProperty",
    ).mockImplementation((key) => {
      if (key === "egtOnboardingSeen") return formatISO(Date.now());
      return null;
    });
    container = renderAtRoute(
      State.Resident.EGT.buildPath({
        stateSlug: "mass",
        personPseudoId: mockAuth.personPseudoId,
      }),
    ).container;
  });

  it("should render", async () => {
    expect(
      await screen.findByText(
        "This information was last updated on December 16, 2021",
      ),
    ).toBeInTheDocument();
  });

  it("should be accessible", async () => {
    await screen.findByText(
      "This information was last updated on December 16, 2021",
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should set the page title", async () => {
    await waitFor(() =>
      expect(document.title).toBe("Earned Time Overview – Opportunities"),
    );
  });
});

it("should redirect to onboarding", async () => {
  mockAuth = mockAuthorized({ stateCode: "US_MA" });
  vi.spyOn(mockAuth.rootStore.userStore, "getUserProperty").mockReturnValue(
    null,
  );
  container = renderAtRoute(
    State.Resident.EGT.buildPath({
      stateSlug: "mass",
      personPseudoId: mockAuth.personPseudoId,
    }),
  ).container;

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Track your Earned Good Time",
    }),
  ).toBeInTheDocument();
});
