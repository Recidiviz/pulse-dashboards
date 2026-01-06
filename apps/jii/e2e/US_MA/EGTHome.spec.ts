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

test.describe("without onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Important dates" }),
    ).toBeVisible();
  });

  test("page title", async ({ page }) => {
    expect(await page.title()).toBe("Earned Time Overview – Opportunities");
  });

  test("accessibility", async ({ page }) => {
    expect((await accessibilityScan(page)).violations).toEqual([]);
  });
});

test.describe("onboarding", () => {
  // clear local storage so that onboarding is not skipped
  test.use({ storageState: { cookies: [], origins: [] } });

  test("takeover", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Track your Earned Good Time" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "See your earned time" }).click();

    await expect(
      page.getByRole("heading", { name: "Important dates" }),
    ).toBeVisible();

    // don't encounter onboarding a second time
    await page.goto(HOMEPAGE_URL);
    await expect(
      page.getByRole("heading", { name: "Important dates" }),
    ).toBeVisible();
  });

  test.describe("page", () => {
    test.beforeEach(async ({ page }) => {
      // for consistency these tests go directly to the onboarding page
      // rather than relying on the takeover behavior, which is stateful and may have
      // already been dismissed
      await page.goto(`${HOMEPAGE_URL}/intro`);
      await expect(
        page.getByRole("heading", { name: "Track your Earned Good Time" }),
      ).toBeVisible();
    });

    test("accessibility", async ({ page }) => {
      expect((await accessibilityScan(page)).violations).toEqual([]);
    });

    test("page title", async ({ page }) => {
      expect(await page.title()).toBe(
        "Track your Earned Good Time – Opportunities",
      );
    });
  });
});
