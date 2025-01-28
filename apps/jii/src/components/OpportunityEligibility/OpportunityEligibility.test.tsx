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

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { outputFixture, usMeResidents, usMeSccpFixtures } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import {
  IncarcerationOpportunityId,
  OpportunityConfig,
} from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { UsMeSCCPEligibilityReport } from "../../models/EligibilityReport/UsMe/UsMeSCCPEligibilityReport";
import { useResidentOpportunityContext } from "../ResidentOpportunityHydrator/context";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { useSingleResidentContext } from "../SingleResidentHydrator/context";
import { OpportunityEligibility } from "./OpportunityEligibility";

vi.mock("../ResidentsHydrator/context");
vi.mock("../SingleResidentHydrator/context");
vi.mock("../ResidentOpportunityHydrator/context");

let residentsStore: ResidentsStore;
const opportunityId: IncarcerationOpportunityId = "usMeSCCP";
const eligibleResident = usMeResidents[0];
const stateConfig = residentsConfigByState.US_ME;
const opportunityConfig = stateConfig.incarcerationOpportunities[
  opportunityId
] as OpportunityConfig;
const eligibilityReport = new UsMeSCCPEligibilityReport(
  eligibleResident,
  opportunityConfig,
  outputFixture(usMeSccpFixtures.RES001almostEligibleMonthsRemaining),
);

beforeEach(() => {
  residentsStore = new ResidentsStore(new RootStore(), stateConfig);

  vi.mocked(useResidentsContext).mockReturnValue({ residentsStore });
  // @ts-expect-error only mocking what we need
  vi.mocked(useSingleResidentContext).mockReturnValue({
    resident: eligibleResident,
  });
  vi.mocked(useResidentOpportunityContext).mockReturnValue({
    opportunity: { opportunityId, opportunityConfig, eligibilityReport },
  });

  render(
    <MemoryRouter>
      <OpportunityEligibility />
    </MemoryRouter>,
  );
});

test("TOC links and destinations", () => {
  const tocLinkUrls = within(screen.getByRole("navigation"))
    .getAllByRole("link")
    .map((e) => e.getAttribute("href"));

  expect(tocLinkUrls).toMatchInlineSnapshot(`
    [
      "/#your-eligibility",
      "/#about-sccp",
      "/#how-to-apply",
    ]
  `);

  tocLinkUrls.forEach((url) => {
    expect(
      document.body.querySelector(url?.substring(1) ?? ""),
    ).toBeInTheDocument();
  });
});
