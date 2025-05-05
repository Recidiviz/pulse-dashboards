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

import { usMeEligibilityConfig } from "../../configs/US_ME/eligibility/config";
import { OpportunityComparisonPresenter } from "./OpportunityComparisonPresenter";

test("maps slugs to correct config", () => {
  const presenter = new OpportunityComparisonPresenter(
    ["work-release", "sccp"],
    usMeEligibilityConfig,
  );

  expect(presenter.pageContents).toMatchSnapshot();
});

test("order doesn't matter", () => {
  const presenter1 = new OpportunityComparisonPresenter(
    ["work-release", "sccp"],
    usMeEligibilityConfig,
  );
  const presenter2 = new OpportunityComparisonPresenter(
    ["sccp", "work-release"],
    usMeEligibilityConfig,
  );

  expect(presenter1.pageContents).toEqual(presenter2.pageContents);
});

test("no matching config", () => {
  // this is a bit contrived since we don't have any unused opportunities
  // as of the time of writing; at scale though we expect this to be less common
  const presenter = new OpportunityComparisonPresenter(
    ["work-release", "work-release"],
    usMeEligibilityConfig,
  );
  expect(() => presenter.pageContents).toThrowErrorMatchingInlineSnapshot(
    `[Error: No comparison page found for work-release and work-release]`,
  );
});

test("no matching opportunity", () => {
  const presenter = new OpportunityComparisonPresenter(
    ["work-release", "invalid-slug"],
    usMeEligibilityConfig,
  );
  expect(() => presenter.pageContents).toThrowErrorMatchingInlineSnapshot(
    `[Error: No opportunity ID matches url segment invalid-slug]`,
  );
});
