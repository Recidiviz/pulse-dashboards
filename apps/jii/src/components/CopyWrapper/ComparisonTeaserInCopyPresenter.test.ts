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
import { ComparisonTeaserInCopyPresenter } from "./ComparisonTeaserInCopyPresenter";

test("comparison found", () => {
  const presenter = new ComparisonTeaserInCopyPresenter(
    {
      opportunityTypes: '["usMeWorkRelease", "usMeSCCP"]',
    },
    usMeEligibilityConfig,
  );
  expect(presenter.linkProps).toBeDefined();
  expect(presenter.linkProps).toEqual({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    config: usMeEligibilityConfig.comparisons![0],
  });
});

test("comparison not found", () => {
  const presenter = new ComparisonTeaserInCopyPresenter(
    {
      opportunityTypes: '["usMeWorkRelease", "someInvalidId"]',
    },
    usMeEligibilityConfig,
  );

  expect(presenter.linkProps).toBeUndefined();
});
