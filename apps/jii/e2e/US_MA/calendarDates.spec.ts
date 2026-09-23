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

import { expect, Page, test } from "@playwright/test";

import { HOMEPAGE_URL } from "./utils";

/**
 * The default configuration is for the browser to run in an US timezone
 * while the server runs in UTC; this is consistent with the production arrangement.
 * We are explicitly re-setting the browser timezone here because we are directly
 * guarding against that discontinuity in these tests.
 */
test.use({ timezoneId: "America/Denver" });

/**
 * Locates a date card by its heading rather than by the date itself. Matching on
 * the value would make a wrong date indistinguishable from a page that never
 * loaded — both would simply time out with "element(s) not found".
 */
function dateCard(page: Page, label: string) {
  return page.getByRole("heading", { name: new RegExp(label) }).locator("..");
}

test("calendar dates survive the server/browser timezone gap", async ({
  page,
}) => {
  await page.goto(HOMEPAGE_URL);
  await expect(
    page.getByRole("heading", { name: "Important dates" }),
  ).toBeVisible();

  // these are the literal calendar days from the US_MA resident fixture;
  // their dates are not shifted forward for e2e tests
  await expect(dateCard(page, "Release-to-supervision date")).toContainText(
    "November 15, 2026",
  );
  await expect(dateCard(page, "Maximum release / wrap date")).toContainText(
    "December 15, 2026",
  );
});
