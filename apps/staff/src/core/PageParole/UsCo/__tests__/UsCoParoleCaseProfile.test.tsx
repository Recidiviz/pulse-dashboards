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

import US_CO_CONFIG from "../../../../tenants/US_CO";
import { UsCoParoleCaseProfile } from "../UsCoParoleCaseProfile";

const CASE = paroleCasesFixtureByState.US_CO["45821"];

// The nav list and the SectionAnchors are two separate lists in the same
// file, so an entry can drift to an id that nothing renders.
const NAV_LABELS = [
  "Offense & Criminal History",
  "Risk Score Trajectory",
  "Latest Risk and Needs Assessment",
  "Program Participation",
  "Institutional Conduct History",
  "Community Supervision Plan",
];

describe("UsCoParoleCaseProfile", () => {
  // jsdom doesn't implement scrollIntoView. scrollToSection is a no-op when
  // no element carries the id, so a call proves the anchor is really there.
  const scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    scrollIntoViewMock.mockClear();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    render(
      <MemoryRouter>
        <UsCoParoleCaseProfile
          caseDetail={CASE}
          config={US_CO_CONFIG.paroleConfig}
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
});
