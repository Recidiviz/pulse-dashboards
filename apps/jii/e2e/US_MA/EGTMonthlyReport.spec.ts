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

import { expect, test } from "@playwright/test";

import { accessibilityScan } from "../utils";
import { HOMEPAGE_URL } from "./utils";

test.beforeEach(async ({ page }) => {
  // the contents of this page are affected by the current date
  await page.clock.setFixedTime("2025-09-01");

  await page.goto(HOMEPAGE_URL);
  await page.getByRole("link", { name: "See July report" }).click();
  await expect(
    page.getByRole("heading", { name: "Monthly Report" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Earned time and program participation in July",
    }),
  ).toBeVisible();
});

test("accessibility", async ({ page }) => {
  expect((await accessibilityScan(page)).violations).toEqual([]);
});

test("page title", async ({ page }) => {
  expect(await page.title()).toBe("July 2025 Report – Opportunities");
});
