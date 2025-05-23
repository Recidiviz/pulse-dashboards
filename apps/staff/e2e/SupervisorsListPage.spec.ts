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

test.describe("Supervisors List Page", () => {
  test.describe("Recidiviz user", () => {
    test("Supervisors list page", async ({ page }) => {
      test.setTimeout(50000);

      await page.goto("/");
      await expect(page.locator(".UserAvatar")).toBeVisible({ timeout: 50000 });
      await switchTenant(page, "Michigan");
      await expect(
        page.getByRole("link", { name: "Recidiviz | Lantern" }),
      ).toBeVisible();
      await expect(page.getByRole("main")).toContainText(
        "Select a supervisor to view their overview",
      );
      await expect(page.getByRole("main")).toContainText("Region 1");
      await expect(
        page.getByRole("link", { name: "Alejandro D Gonzalez" }),
      ).toBeVisible();
      await switchTenant(page, "Tennessee");
      await expect(
        page.getByRole("link", { name: "Recidiviz | Lantern" }),
      ).toBeVisible();
    });
  });

  test.describe("US_MI user", () => {
    test("Supervisors list page - with supervisors_list permission", async ({
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
            "insights_supervision_supervisors-list": true,
          };
          json["https://dashboard.recidiviz.org/app_metadata"].featureVariants =
            { insightsLeadershipPageAllDistricts: true };
          await route.fulfill({ response, json });
        },
      );

      await page.goto("/");
      await expect(
        page.getByRole("link", { name: "Recidiviz | Lantern" }),
      ).toBeVisible();
      await expect(page.getByRole("main")).toContainText(
        "Select a supervisor to view their overview",
      );
      await expect(page.getByRole("main")).toContainText("Region 1");
      await expect(
        page.getByRole("link", { name: "Alejandro D Gonzalez" }),
      ).toBeVisible();
    });

    test("Supervisors list page - with supervisors_list permission + supervisor homepage", async ({
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
            "insights_supervision_supervisors-list": true,
          };
          json["https://dashboard.recidiviz.org/app_metadata"].featureVariants =
            { insightsLeadershipPageAllDistricts: {} };
          await route.fulfill({ response, json });
        },
      );

      await page.goto("/");
      await expect(
        page.getByRole("link", { name: "Recidiviz | Lantern" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Alejandro D Gonzalez" }),
      ).toBeVisible();
    });
  });

  test.describe("US_TN user", () => {
    test("Supervisors list page - without supervisors_list permission (redirect)", async ({
      page,
    }) => {
      await page.route(
        "http://localhost:3001/api/offlineUser?*",
        async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          json["https://dashboard.recidiviz.org/app_metadata"].stateCode =
            "us_tn";
          json["https://dashboard.recidiviz.org/app_metadata"].routes = {
            insights: true,
            "insights_supervision_supervisors-list": false,
          };

          await route.fulfill({ response, json });
        },
      );

      await page.goto("/");
      await expect(
        page.getByRole("link", { name: "Recidiviz | Lantern" }),
      ).toBeVisible();
      await expect(
        page.getByText("Alejandro D Gonzalez Overview"),
      ).toBeVisible();
      await expect(page.getByText("Outcomes")).toBeVisible();
      await expect(page.getByText("Walter Harris")).toBeVisible();
    });
  });
});
