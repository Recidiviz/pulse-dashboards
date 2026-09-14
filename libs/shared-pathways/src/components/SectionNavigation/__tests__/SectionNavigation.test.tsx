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

import { fireEvent, render, screen } from "@testing-library/react";

import { PathwaysSection } from "../../../views";
import { SectionNavigation } from "../SectionNavigation";

const sections = {
  countOverTime: "Overview",
  countByAdmissionType: "Admission Type",
  countByReleaseType: "Release Type",
} as Record<PathwaysSection, string>;

function renderNav(
  disabledSections: Partial<Record<PathwaysSection, string>> = {},
) {
  const onSectionSelect = vi.fn();
  render(
    <SectionNavigation
      sections={sections}
      activeSection={"countOverTime" as PathwaysSection}
      onSectionSelect={onSectionSelect}
      disabledSections={disabledSections}
    />,
  );
  return { onSectionSelect };
}

describe("SectionNavigation", () => {
  it("selects an available section when its pill is clicked", () => {
    const { onSectionSelect } = renderNav();

    fireEvent.click(screen.getByRole("menuitem", { name: "Admission Type" }));

    expect(onSectionSelect).toHaveBeenCalledWith("countByAdmissionType");
  });

  it("still lists a disabled section, so its pill keeps its place", () => {
    renderNav({ countByReleaseType: "Admissions only" });

    expect(
      screen.getByRole("menuitem", { name: /Release Type/ }),
    ).toBeInTheDocument();
  });

  it("does not select a disabled section when its pill is clicked", () => {
    const { onSectionSelect } = renderNav({
      countByReleaseType: "Admissions only",
    });

    fireEvent.click(screen.getByRole("menuitem", { name: /Release Type/ }));

    expect(onSectionSelect).not.toHaveBeenCalled();
  });

  it("gives a disabled section its reason as a tooltip", () => {
    renderNav({ countByReleaseType: "Admissions only" });

    const pill = screen.getByRole("menuitem", {
      name: "Release Type, Admissions only",
    });
    expect(pill).toHaveAttribute("title", "Admissions only");
    expect(pill).toHaveAttribute("aria-disabled", "true");
  });
});
