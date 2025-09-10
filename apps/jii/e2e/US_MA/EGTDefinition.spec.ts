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
  await page.goto(HOMEPAGE_URL);
});

test.describe("RTS page", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("link", { name: "Learn more about RTS" }).click();
    await expect(
      page.getByRole("heading", { name: "Release-to-supervision date" }),
    ).toBeVisible();
  });

  test("accessibility", async ({ page }) => {
    expect((await accessibilityScan(page)).violations).toEqual([]);
  });

  test("sets page title", async ({ page }) => {
    expect(await page.title()).toBe(
      "Release-to-supervision date – Opportunities",
    );
  });
});

test.describe("credits page", () => {
  test.beforeEach(async ({ page }) => {
    await page
      .getByRole("link", { name: "Learn more about earned time" })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Earned Good Time, Boosts, and Completion Credits",
      }),
    ).toBeVisible();
  });

  test("accessibility", async ({ page }) => {
    expect((await accessibilityScan(page)).violations).toEqual([]);
  });

  test("sets page title", async ({ page }) => {
    expect(await page.title()).toBe(
      "Earned Good Time, Boosts, and Completion Credits – Opportunities",
    );
  });
});
