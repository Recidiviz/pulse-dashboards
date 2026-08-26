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

import { Page } from "playwright";

const METADATA_NAMESPACE = "https://dashboard.recidiviz.org/";

export type OfflineUserSpec = {
  // Lowercase (e.g. "us_tn") — this is what the app_metadata carries.
  stateCode: string;
  // Keys the Firestore staff fixture the mint endpoint looks up, which is where
  // district / roleSubtype / hasCaseload come from. Leave unset for the default
  // Recidiviz user, which resolves to unrestricted scope.
  externalId?: string;
  email?: string;
  featureVariants?: Record<string, unknown>;
  routes?: Record<string, boolean>;
};

/**
 * Pins the offline user for a test on BOTH sides of the app.
 *
 * The browser and staff-server each build their own offline user, and neither
 * sees the other's. Mocking `/api/offlineUser` alone only reaches the browser —
 * staff-server calls `fetchOfflineUser` in process, so its scoped keys would
 * still be minted for the default Recidiviz identity (i.e. unrestricted, in
 * every test). This installs both routes from one spec so the two agree.
 */
export const mockOfflineUser = async (
  page: Page,
  spec: OfflineUserSpec,
): Promise<void> => {
  // Drives the active tenant, the feature variants, and route access.
  await page.route("**/api/offlineUser*", async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    const appMetadata = json[`${METADATA_NAMESPACE}app_metadata`];

    appMetadata.stateCode = spec.stateCode;
    appMetadata.allowedStates = [spec.stateCode.toUpperCase()];
    if (spec.externalId !== undefined) {
      appMetadata.externalId = spec.externalId;
      appMetadata.pseudonymizedId = `hashed-${spec.externalId}`;
    }
    if (spec.email !== undefined) json.email = spec.email;
    if (spec.featureVariants !== undefined) {
      appMetadata.featureVariants = spec.featureVariants;
    }
    if (spec.routes !== undefined) appMetadata.routes = spec.routes;

    await route.fulfill({ response, json });
  });

  // Injected here rather than sent by the app, so no production code has to
  // know about it. Read by `offlineUserOverrides` in staff-server.
  await page.route("**/workflows/*-scoped-key", async (route) => {
    const body = route.request().postDataJSON() ?? {};
    await route.continue({
      postData: JSON.stringify({ ...body, offlineUser: spec }),
    });
  });
};

export const switchTenant = async (
  page: Page,
  stateName: string,
): Promise<void> => {
  // TODO #5162 - find by locator .ProfileLink once the class is added to the button in all layouts
  await page.locator(".ProfileDropdownButton").click();
  await page.getByRole("menuitem").locator(".AccountLink").click();
  await page.getByRole("button", { name: stateName }).click();
};
