// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { paroleCasesFixtureByState } from "~datatypes";

import US_ID_CONFIG from "../../../../tenants/US_ID";
import { UsIdParoleCaseProfile } from "../UsIdParoleCaseProfile";

const CASE = Object.values(paroleCasesFixtureByState.US_ID)[0];

// The nav list and the SectionAnchors are two separate lists in the same
// file, so an entry can drift to an id that nothing renders.
const NAV_LABELS = ["Offense Information", "Institutional History"];

describe("UsIdParoleCaseProfile", () => {
  // jsdom doesn't implement scrollIntoView. scrollToSection is a no-op when
  // no element carries the id, so a call proves the anchor is really there.
  const scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    scrollIntoViewMock.mockClear();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    render(
      <MemoryRouter>
        <UsIdParoleCaseProfile
          caseDetail={CASE}
          config={US_ID_CONFIG.paroleConfig}
        />
      </MemoryRouter>,
    );
  });

  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it.each(NAV_LABELS)("scrolls to a real section for %s", async (label) => {
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: label }));

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it("offers the report download, which Colorado does not", () => {
    expect(
      screen.getByRole("button", { name: /download/i }),
    ).toBeInTheDocument();
  });
});
