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
import { axe } from "jest-axe";

import {
  mockAuthorized,
  renderAtRoute,
} from "../../common/components/pages/testUtils";
import { residentsConfigByState } from "../../configs/residentsConfig";
import { OpportunityConfig } from "../../configs/types";
import { State } from "../../routes/routes";

let container: HTMLElement;
const sccpConfig = residentsConfigByState.US_ME.eligibility
  ?.incarcerationOpportunities.usMeSCCP as OpportunityConfig;

beforeEach(() => {
  const mockAuth = mockAuthorized();
  container = renderAtRoute(
    State.Resident.Eligibility.Opportunity.buildPath({
      opportunitySlug: sccpConfig.urlSlug,
      stateSlug: "maine",
      personPseudoId: mockAuth.personPseudoId,
    }),
  ).container;
});

it("should render", async () => {
  expect(
    await screen.findByRole("heading", {
      name: residentsConfigByState.US_ME.eligibility?.incarcerationOpportunities
        .usMeSCCP?.name,
      level: 1,
    }),
  ).toBeInTheDocument();
});

it("should be accessible", async () => {
  await screen.findByRole("heading", {
    name: residentsConfigByState.US_ME.eligibility?.incarcerationOpportunities
      .usMeSCCP?.name,
    level: 1,
  });

  expect(await axe(container)).toHaveNoViolations();
});

it("should set page title", () => {
  expect(window.document.title).toBe(`${sccpConfig.name} – Opportunities`);
});
