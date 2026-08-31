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

import { ParoleCommunitySupervisionPlanEntry } from "~datatypes";

import { PaletteKey, statusStyles } from "../../../BadgePill/BadgePill";
import { CommunitySupervisionPlanSection } from "../CommunitySupervisionPlanSection";

function makeEntry(
  fields: Partial<ParoleCommunitySupervisionPlanEntry>,
): ParoleCommunitySupervisionPlanEntry {
  return {
    typeOfPlan: "Regular Parole Plan Planned Residence after Release",
    name: "John Doe",
    relationship: "Grandfather",
    address: "123 South St, Center City, CO 29385",
    recommended: "YES (Favorable)",
    ...fields,
  };
}

const RECOMMENDED_STATUS_PALETTE: Array<
  [ParoleCommunitySupervisionPlanEntry["recommended"], PaletteKey]
> = [
  ["YES (Favorable)", "GREEN"],
  ["NO (Unfavorable)", "RED"],
  ["Pending", "YELLOW"],
  ["TBD", "SLATE"],
  ["Withdrawn", "SLATE_DARK"],
];

describe("CommunitySupervisionPlanSection", () => {
  it("renders the type of plan, name (relationship), and address for each entry", () => {
    const entry = makeEntry({});
    render(
      <CommunitySupervisionPlanSection communitySupervisionPlan={[entry]} />,
    );

    expect(
      screen.getByText("Regular Parole Plan Planned Residence after Release"),
    ).toBeInTheDocument();
    expect(screen.getByText("John Doe (Grandfather)")).toBeInTheDocument();
    expect(
      screen.getByText("123 South St, Center City, CO 29385"),
    ).toBeInTheDocument();
  });

  it("renders the empty state when there are no plan entries", () => {
    render(<CommunitySupervisionPlanSection communitySupervisionPlan={[]} />);

    expect(
      screen.getByText("No community supervision plan on file."),
    ).toBeInTheDocument();
  });

  it.each(RECOMMENDED_STATUS_PALETTE)(
    "renders a %s badge with the %s palette",
    (recommended, paletteKey) => {
      const entry = makeEntry({ recommended });
      render(
        <CommunitySupervisionPlanSection communitySupervisionPlan={[entry]} />,
      );

      expect(screen.getByText(recommended)).toHaveStyleRule(
        "background-color",
        statusStyles[paletteKey].backgroundColor,
      );
    },
  );
});
