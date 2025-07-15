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

import { screen } from "@testing-library/react";
import { formatISO } from "date-fns";
import { axe } from "jest-axe";

import {
  mockAuthorized,
  renderAtRoute,
} from "../../../../common/components/pages/testUtils";
import { State } from "../../../../routes/routes";
import { usMaEGTCopy } from "../../configs/US_MA/copy";

describe.each(
  Object.keys(usMaEGTCopy.infoPages) as Array<
    keyof typeof usMaEGTCopy.infoPages
  >,
)("definition page: %s", (pageSlug) => {
  let container: HTMLElement;
  let mockAuth: ReturnType<typeof mockAuthorized>;

  beforeEach(() => {
    mockAuth = mockAuthorized({ stateCode: "US_MA" });
    vi.spyOn(
      mockAuth.rootStore.userStore,
      "getUserProperty",
    ).mockImplementation((key) => {
      if (key === "egtOnboardingSeen") return formatISO(Date.now());
      return null;
    });
    const route = State.Resident.EGT.Definition.buildPath({
      stateSlug: "mass",
      personPseudoId: mockAuth.personPseudoId,
      pageSlug,
    });

    vi.stubGlobal("location", { pathname: route, hostname: "localhost" });

    container = renderAtRoute(route).container;
  });

  it("should render", async () => {
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: usMaEGTCopy.infoPages[pageSlug].heading,
      }),
    ).toBeInTheDocument();
  });

  it("should be accessible", async () => {
    await screen.findByRole("heading", {
      level: 1,
      name: usMaEGTCopy.infoPages[pageSlug].heading,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should set the page title", () => {
    expect(document.title).toMatchSnapshot();
  });
});
