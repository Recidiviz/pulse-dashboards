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
import { HEADER_PORTAL_ID } from "../AppLayout/constants";
import { useResidentOpportunityContext } from "../ResidentOpportunityHydrator/context";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { useSingleResidentContext } from "../SingleResidentHydrator/context";
import { useRootStore } from "../StoreProvider/useRootStore";
import { OpportunityEligibility } from "./OpportunityEligibility";

vi.mock("../ResidentsHydrator/context");
vi.mock("../SingleResidentHydrator/context");
vi.mock("../ResidentOpportunityHydrator/context");
vi.mock("../StoreProvider/useRootStore");

let residentsStore: ResidentsStore;
const opportunityId: IncarcerationOpportunityId = "usMeSCCP";
const eligibleResident = usMeResidents[0];
const stateConfig = residentsConfigByState.US_ME;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const opportunityConfig = stateConfig.eligibility!.incarcerationOpportunities[
  opportunityId
] as OpportunityConfig;
const eligibilityReport = new UsMeSCCPEligibilityReport(
  eligibleResident,
  opportunityConfig,
  outputFixture(usMeSccpFixtures.RES001almostEligibleMonthsRemaining),
);

beforeEach(() => {
  const rootStore = new RootStore();
  residentsStore = new ResidentsStore(rootStore, stateConfig);

  vi.mocked(useRootStore).mockReturnValue(rootStore);
  vi.mocked(useResidentsContext).mockReturnValue({ residentsStore });
  // @ts-expect-error only mocking what we need
  vi.mocked(useSingleResidentContext).mockReturnValue({
    resident: eligibleResident,
  });
  vi.mocked(useResidentOpportunityContext).mockReturnValue({
    opportunity: { opportunityId, opportunityConfig, eligibilityReport },
  });

  // component will try to render a Portal here
  const portalRoot = document.createElement("div");
  portalRoot.setAttribute("id", HEADER_PORTAL_ID);
  document.body.appendChild(portalRoot);

  render(
    <MemoryRouter>
      <OpportunityEligibility />
    </MemoryRouter>,
  );
});

afterEach(() => {
  document.getElementById(HEADER_PORTAL_ID)?.remove();
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
