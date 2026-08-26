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

import { APIRequestContext } from "@playwright/test";
import { Page } from "playwright";

const METADATA_NAMESPACE = "https://dashboard.recidiviz.org/";

export const API_BASE_URL =
  process.env["API_BASE_URL"] ?? "http://localhost:3001";
export const TYPESENSE_URL =
  process.env["TYPESENSE_HOST"] ?? "http://localhost:8108";

// Typesense wants a `query_by` even for the match-everything `*` query.
const QUERY_BY: Record<string, string> = {
  supervisionStaff: "surname",
  incarcerationStaff: "surname",
  locations: "name",
  clients: "personName.surname",
  residents: "personName.surname",
};

/**
 * POSTs to a scoped-key endpoint, retrying past staff-server's rate limit.
 *
 * Every route is capped at 15 requests per second per IP, and a spec full of
 * mint calls trips it. A 429 says nothing about the scoping under test, so back
 * off rather than let a shared limit read as a failure.
 */
export const postScopedKey = async (
  api: APIRequestContext,
  path: string,
  data: Record<string, unknown>,
) => {
  let response = await api.post(path, { data });

  /* eslint-disable no-await-in-loop -- sequential by design: each retry has to
   * wait out the rate-limit window before the next attempt is worth making. */
  for (let attempt = 0; response.status() === 429 && attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    response = await api.post(path, { data });
  }
  /* eslint-enable no-await-in-loop */

  return response;
};

export type MintedScopedKeys = {
  // Collection -> scoped key.
  keys: Record<string, string>;
  // Collection -> the filter_by baked into that key. Offline-only, from the
  // endpoint's `_debug` payload.
  filters: Record<string, string>;
};

/**
 * Mints a caseload scoped key set as a given offline user.
 *
 * Returns the filters as well as the keys so a test can assert what was
 * compiled and what it actually matches. Those are different failures: a wrong
 * filter is a scoping bug, whereas a correct filter that Typesense rejects is a
 * schema bug, and only querying with the key distinguishes them.
 */
export const mintCaseloadKeys = async (
  api: APIRequestContext,
  options: {
    stateCode: string;
    system: "SUPERVISION" | "INCARCERATION" | "ALL";
    offlineUser: OfflineUserSpec;
  },
): Promise<MintedScopedKeys> => {
  const response = await postScopedKey(
    api,
    `/api/${options.stateCode}/workflows/caseload-scoped-key`,
    { system: options.system, offlineUser: options.offlineUser },
  );

  if (!response.ok()) {
    throw new Error(
      `Mint failed: ${response.status()} ${await response.text()}`,
    );
  }

  const body = await response.json();
  if (!body._debug) {
    throw new Error(
      "Mint response carried no `_debug`. These specs read the compiled filters from it, which staff-server only returns when IS_OFFLINE is true.",
    );
  }

  return { keys: body.keys, filters: body._debug.filtersByCollection };
};

/**
 * Runs a match-everything search against one collection using its own scoped
 * key, and returns the value of `idField` for every hit.
 *
 * Throws on a Typesense-level error rather than returning an empty list — an
 * undeclared filter field comes back as a per-search error, and silently
 * reading that as "no results" would let a broken key pass as a narrow scope.
 */
export const searchIds = async (
  keys: Record<string, string>,
  collection: string,
  idField: string,
): Promise<string[]> => {
  const scopedKey = keys[collection];
  if (!scopedKey) {
    throw new Error(
      `No key for "${collection}". Minted: ${Object.keys(keys).join(", ") || "(none)"}.`,
    );
  }

  const response = await fetch(`${TYPESENSE_URL}/multi_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TYPESENSE-API-KEY": scopedKey,
    },
    body: JSON.stringify({
      searches: [
        {
          collection,
          q: "*",
          query_by: QUERY_BY[collection],
          per_page: 250,
        },
      ],
    }),
  });

  const body = await response.json();
  const result = body.results?.[0];
  if (!result || result.error) {
    throw new Error(
      `Typesense rejected the search on "${collection}": ${result?.error ?? JSON.stringify(body)}`,
    );
  }

  return (result.hits ?? []).map(
    (hit: { document: Record<string, string> }) => hit.document[idField],
  );
};

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
