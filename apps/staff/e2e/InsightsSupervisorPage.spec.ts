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
      await page
        .getByRole("link", {
          name: "Absconsions Absconsions See trends and cases Swarm plot of all absconsion rates in the state for SEX_OFFENSE caseloads, highlighting a value of 10.6%, which is far worse than the statewide rate of 2.9%. Other values in the chart range from 0% to 12%. Statewide rate At or below statewide rate Slightly worse than statewide rate Far worse than statewide rate",
          exact: true,
        })
        .click();
      await page
        .getByRole("link", { name: " Go to Alejandro D Gonzalez'" })
        .click();
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
            "us_mi";
          json["https://dashboard.recidiviz.org/app_metadata"].routes = {
            insights: true,
          };
          json["https://dashboard.recidiviz.org/app_metadata"].featureVariants =
            {
              supervisorHomepage: false,
            };
          await route.fulfill({ response, json });
        },
      );

      await page.goto("/");
      const main = page.getByRole("main");
      await main.waitFor({ state: "attached", timeout: 10000 });

      await expect(main).toContainText(
        "Jack Hernandez is in the top 10% of officers in the state for highest program/treatment starts rate this year.",
      );
    });

    test("New supervisor homepage user", async ({ page }) => {
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
              supervisorHomepage: {},
            };
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
        "Jack Hernandez is in the top 10% of officers in the state for highest program/treatment starts rate this year.",
      );

      // then check that link takes user to staff page with banner
      await link.click();
      await expect(page.getByRole("main")).toContainText(
        "Jack is in the top 10% of officers in the state for highest program/treatment starts rate this year.",
      );
    });
  });
});
