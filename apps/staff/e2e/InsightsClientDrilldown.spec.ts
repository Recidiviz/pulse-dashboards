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

import { expect, test } from "@playwright/test";

import { switchTenant } from "./utils";

test.describe("Insights Client Drilldown", () => {
  test.describe("Non-Lantern user", () => {
    test("Client drilldown", async ({ page }) => {
      test.setTimeout(50000);

      await page.goto("/");
      await switchTenant(page, "Idaho");
      await page.getByRole("link", { name: "Alejandro D Gonzalez" }).click();
      await page
        .getByRole("link", { name: "Walter Harris Absconsion Rate" })
        .click();
      await page.getByRole("link", { name: "Absconsion Rate" }).click();
      await expect(page.getByRole("rowgroup")).toContainText("Terry Clark");
      // link never becomes visible to playwright so this is a workaround to be able to open the modal
      await page
        .getByRole("link", { name: "Terry Clark" })
        .evaluate((element: HTMLElement) => element.click());
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("dialog")).toContainText("Terry Clark");
      await expect(page.getByRole("dialog")).toContainText("Client Details");
      await expect(page.getByRole("dialog")).not.toContainText(
        "Supervision Details",
      );
      await expect(page.getByRole("dialog")).toContainText("Record of Events");
      await expect(page.locator("dl")).toBeVisible();
      await expect(page.getByRole("img", { name: "Lantern" })).toBeHidden();
    });
  });

  test.describe("Lantern user", () => {
    test("Client drilldown", async ({ page }) => {
      test.setTimeout(50000);

      await page.goto("/");
      await switchTenant(page, "Michigan");
      await page.getByRole("link", { name: "Alejandro D Gonzalez" }).click();
      await page.getByRole("link", { name: "Harriet Boyd Absconder" }).click();
      await page
        .getByRole("link", { name: "Absconder Warrant Rate: 16.0" })
        .click();
      await expect(page.getByRole("rowgroup")).toContainText("Terry Clark");
      // link never becomes visible to playwright so this is a workaround to be able to open the modal
      await page
        .getByRole("link", { name: "Terry Clark" })
        .evaluate((element: HTMLElement) => element.click());
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("dialog")).toContainText("Terry Clark");
      await expect(page.getByRole("dialog")).toContainText("Client Details");
      await expect(page.getByRole("dialog")).toContainText(
        "Supervision Details",
      );
      await expect(page.getByRole("dialog")).toContainText("Record of Events");
      await expect(page.getByRole("table")).toBeVisible();
      await expect(page.getByRole("img", { name: "Lantern" })).toBeVisible();
    });
  });
});
