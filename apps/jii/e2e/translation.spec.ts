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

import { permissionSchema } from "~@jii/auth";

import { clearAllLoaders } from "./utils";

// we can't really import configs etc directly into this Node environment
// due to dependencies on Vite, so make sure values in here match up with
// the config objects in @jii/data
[
  {
    state: "US_MA",
    slug: "mass",
    expectSpanishEnabled: false,
  },
  {
    state: "US_TN",
    slug: "tennessee",
    expectSpanishEnabled: false,
  },
  {
    state: "US_AZ",
    slug: "arizona",
    expectSpanishEnabled: false,
  },
  {
    state: "US_NE",
    slug: "nebraska",
    expectSpanishEnabled: false,
  },
].forEach((opts) => {
  test.describe(`${opts.state}`, () => {
    // convention is for test data to use predictable resident IDs.
    // we expect this one to always exist in any state
    const residentUrl = `${opts.slug}/anonres001`;

    test.beforeEach(async ({ page }) => {
      // the contents of this page are affected by the current date
      await page.clock.setFixedTime("2025-10-28");
    });

    test("with translator permission", async ({ page }) => {
      await page.goto(residentUrl);

      await clearAllLoaders(page);

      expect(await page.innerText("body")).toMatchSnapshot({
        name: `${opts.state}-en`,
      });

      await page.goto(`${residentUrl}?locale=es`);
      await clearAllLoaders(page);

      expect(await page.innerText("body")).toMatchSnapshot({
        // we don't care if the language is enabled, translator permission overrides this.
        // even if there is no copy the page may be partially translated due to locale-specific
        // formatting of dates, numbers, etc
        name: `${opts.state}-es`,
      });
    });

    test("without translator permission", async ({ page }) => {
      // have to initiate navigation somewhere before we can start interacting with the page
      await page.goto("/");

      const editedPermissions = JSON.stringify(
        permissionSchema.options.filter((p) => p !== "translator"),
      );

      await page.evaluate((editedPermissions) => {
        window.localStorage.setItem(
          // magic value that overrides the offline mode user permissions
          "offlinePermissionsOverride",
          editedPermissions,
        );
      }, editedPermissions);

      await page.goto(`${residentUrl}?locale=es`);
      await clearAllLoaders(page);
      expect(await page.innerText("body")).toMatchSnapshot({
        name: `${opts.state}-${opts.expectSpanishEnabled ? "es" : "en"}`,
      });
    });
  });
});
