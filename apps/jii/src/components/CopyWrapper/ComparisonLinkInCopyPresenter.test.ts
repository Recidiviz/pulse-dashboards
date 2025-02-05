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

import { usMeResidentsConfig } from "../../configs/US_ME/residents/residentsConfig";
import { ComparisonLinkInCopyPresenter } from "./ComparisonLinkInCopyPresenter";

test("comparison found", () => {
  const presenter = new ComparisonLinkInCopyPresenter(
    {
      opportunityTypes: '["usMeWorkRelease", "usMeSCCP"]',
    },
    usMeResidentsConfig,
  );
  expect(presenter.linkProps).toBeDefined();
  expect(presenter.linkProps).toEqual({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    config: usMeResidentsConfig.comparisons![0],
  });
});

test("comparison not found", () => {
  const presenter = new ComparisonLinkInCopyPresenter(
    {
      opportunityTypes: '["usMeWorkRelease", "someInvalidId"]',
    },
    usMeResidentsConfig,
  );

  expect(presenter.linkProps).toBeUndefined();
});
