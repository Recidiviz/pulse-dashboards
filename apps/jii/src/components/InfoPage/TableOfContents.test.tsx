// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { format } from "prettier";
import { MemoryRouter } from "react-router-dom";

import { usMeResidents } from "~datatypes";

import {
  IncarcerationOpportunityId,
  OpportunityConfig,
} from "../../configs/types";
import { usMeEligibilityConfig } from "../../configs/US_ME/eligibility/config";
import { State } from "../../routes/routes";
import { TableOfContents } from "./TableOfContents";

const opportunityId: IncarcerationOpportunityId = "usMeSCCP";
const oppConfig = usMeEligibilityConfig.incarcerationOpportunities[
  opportunityId
] as OpportunityConfig;

const ineligibleResident = usMeResidents[usMeResidents.length - 1];

test("generates links to headings in page body", async () => {
  const { container } = render(
    <MemoryRouter
      initialEntries={[
        State.Resident.Eligibility.Opportunity.InfoPage.buildPath({
          stateSlug: "maine",
          opportunitySlug: oppConfig.urlSlug,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          pageSlug: oppConfig.requirements.fullPage!.urlSlug,
          personPseudoId: ineligibleResident.pseudonymizedId,
        }),
      ]}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
      <TableOfContents body={oppConfig.requirements.fullPage!.body} />
    </MemoryRouter>,
  );

  // what we want to test is that it generated the correct links;
  // wrapper markup contains styled-components generated code that may cause test flakiness
  const links = container.querySelector("ol");

  expect(await format(links?.outerHTML ?? "", { parser: "html" }))
    .toMatchInlineSnapshot(`
      "<ol>
        <li>
          <a
            href="/maine/anonres999/eligibility/sccp/requirements#how-do-i-qualify-for-sccp"
            >How do I qualify for SCCP?</a
          >
        </li>
        <li>
          <a
            href="/maine/anonres999/eligibility/sccp/requirements#how-is-my-current-release-date-calculated"
            >How is my Current Release Date calculated?</a
          >
        </li>
        <li>
          <a
            href="/maine/anonres999/eligibility/sccp/requirements#what-is-a-12-time-or-23-time-date-how-are-those-calculated"
            >What is a 1/2 Time or 2/3 Time Date? How are those calculated?</a
          >
        </li>
      </ol>
      "
    `);
});
