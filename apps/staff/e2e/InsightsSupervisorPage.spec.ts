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

import { expect, Page, test } from "@playwright/test";

test.describe("Supervisors Page", () => {
  test.describe("US_MI user", () => {
    test("Supervisors page - disable action strategy on banner cleanup", async ({
      page,
    }) => {
      await page.route(
        "http://localhost:3001/api/offlineUser?*",
        async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          json["https://dashboard.recidiviz.org/app_metadata"].stateCode =
            "us_mi";
          json["https://dashboard.recidiviz.org/app_metadata"].routes = {
            insights: true,
          };
          json["https://dashboard.recidiviz.org/app_metadata"].featureVariants =
            {
              actionStrategies: {},
            };
          await route.fulfill({ response, json });
        },
      );

      await page.goto("/");
      await expect(
        page.getByRole("link", { name: "Recidiviz | Lantern" }),
      ).toBeVisible();
      await expect(page.getByRole("main")).toContainText(
        "How might I work with my team to improve these metrics?",
      );
      // Click the first staff member page found
      await page
        .getByRole("main")
        .locator('a[href*="insights/supervision/staff/"]')
        .first()
        .click();
      await expect(
        page.getByRole("link", { name: "Recidiviz | Lantern" }),
      ).toBeVisible();
      await page.goBack();
      await expect(
        page.getByRole("link", { name: "Recidiviz | Lantern" }),
      ).toBeVisible();
      await expect(page.getByRole("main")).not.toContainText(
        "How might I work with my team to improve these metrics?",
      );
    });
  });

  test.describe("Displays positive officer highlights", () => {
    test("Legacy UI user", async ({ page }) => {
      await page.route(
        "http://localhost:3001/api/offlineUser?*",
        async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          json["https://dashboard.recidiviz.org/app_metadata"].stateCode =
            "us_ca";
          json["https://dashboard.recidiviz.org/app_metadata"].routes = {
            insights: true,
          };
          json["https://dashboard.recidiviz.org/app_metadata"].featureVariants =
            {};
          await route.fulfill({ response, json });
        },
      );

      await page.goto("/");
      const main = page.getByRole("main");
      await main.waitFor({ state: "attached", timeout: 10000 });

      await expect(main).toContainText(
        "Jack Hernandez is in the top 10% of agents in the state for highest program starts rate this year.",
      );
    });

    test("New supervisor homepage user", async ({ page }) => {
      await page.route(
        "http://localhost:3001/api/offlineUser?*",
        async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          json["https://dashboard.recidiviz.org/app_metadata"].stateCode =
            "us_ca";
          json["https://dashboard.recidiviz.org/app_metadata"].routes = {
            insights: true,
          };
          json["https://dashboard.recidiviz.org/app_metadata"].featureVariants =
            {};
          await route.fulfill({ response, json });
        },
      );

      // first check that banner appears correctly on supervisor page
      await page.goto("/");
      const main = page.getByRole("main");
      await main.waitFor({ state: "attached", timeout: 10000 });

      const link = main.locator("a", { hasText: "Jack Hernandez" });

      await expect(link).toBeVisible();

      const href = await link.getAttribute("href");
      expect(href).toBe("/insights/supervision/staff/hashed-so2");

      await expect(main).toContainText(
        "Jack Hernandez is in the top 10% of agents in the state for highest program starts rate this year.",
      );

      // then check that link takes user to staff page with banner
      await link.click();
      await expect(page.getByRole("main")).toContainText(
        "Jack is in the top 10% of agents in the state for highest program starts rate this year.",
      );
    });

    test("Non-enabled state does not show banner", async ({ page }) => {
      await page.route(
        "http://localhost:3001/api/offlineUser?*",
        async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          json["https://dashboard.recidiviz.org/app_metadata"].stateCode =
            "us_mi";
          json["https://dashboard.recidiviz.org/app_metadata"].routes = {
            insights: true,
          };
          json["https://dashboard.recidiviz.org/app_metadata"].featureVariants =
            {};
          await route.fulfill({ response, json });
        },
      );

      await page.goto("/");
      const main = page.getByRole("main");
      await main.waitFor({ state: "attached", timeout: 10000 });

      await expect(main).not.toContainText(
        "Jack Hernandez is in the top 10% of agents in the state for highest program/treatment starts rate this year.",
      );
    });
  });

  test.describe("Roster change request modal", () => {
    const loadPage = async (page: Page, hasFv = true) => {
      await page.route(
        "http://localhost:3001/api/offlineUser?*",
        async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          json["https://dashboard.recidiviz.org/app_metadata"].stateCode =
            "us_tn";
          json["https://dashboard.recidiviz.org/app_metadata"].routes = {
            insights: true,
          };
          json["https://dashboard.recidiviz.org/app_metadata"].featureVariants =
            hasFv ? { reportIncorrectRosters: {} } : {};
          await route.fulfill({ response, json });
        },
      );
      await page.goto("/");
    };

    test("Button does not appear", async ({ page }) => {
      await loadPage(page, false);
      const main = page.getByRole("main");
      await main.waitFor({ state: "attached", timeout: 10000 });
      const pageLayout = main.locator(
        "_react=InsightsPageLayout__PageWrapper",
        {
          hasText: "Overview",
        },
      );
      await pageLayout.waitFor({ state: "visible", timeout: 10000 });
      const button = pageLayout.locator("button", { hasText: /^View$/ });
      await expect(button).toHaveCount(0);
    });

    test("Expect modal's first view to work as it should", async ({ page }) => {
      await loadPage(page);

      const main = page.getByRole("main");
      await main.waitFor({ state: "attached", timeout: 10000 });
      await expect(main).toContainText("View");
      const button = main.locator("button", { hasText: "View" });
      await button.click();
      const rosterModal = page.locator('div[class^="ReactModal__Content"]', {
        hasText: "Officers on Your Team",
      });
      rosterModal.waitFor();
      await expect(rosterModal).toContainText("Walter Harris");
      const toStaffPage = rosterModal.locator("a", {
        hasText: "Walter Harris",
      });
      await toStaffPage.click();
      await main.waitFor({ state: "attached", timeout: 10000 });
      expect(page.url()).toContain("staff");
    });

    test("Expect modal's second view to work as it should", async ({
      page,
    }) => {
      await loadPage(page);

      const main = page.getByRole("main");
      await main.waitFor({ state: "attached", timeout: 10000 });
      await expect(main).toContainText("View");
      const button = main.locator("button", { hasText: "View" });
      await button.click();
      const rosterModal = page.locator(
        'div[class^="styles__RosterRequestViewContainer"]',
      );
      await rosterModal.waitFor();
      const selectOfficerForRemovalButton = rosterModal
        .locator("button", {
          hasText: "Remove",
        })
        .first();

      await selectOfficerForRemovalButton.waitFor();
      await selectOfficerForRemovalButton.evaluate((button) =>
        (button as HTMLButtonElement).click(),
      );
      await rosterModal.waitFor({ state: "visible" });
      const submitButton = rosterModal
        .getByRole("button")
        .filter({ hasText: "Request Removal" });
      await submitButton.waitFor();
      expect(submitButton).toBeDefined();
    });
  });
});
