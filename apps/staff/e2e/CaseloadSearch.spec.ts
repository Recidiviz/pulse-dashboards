// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

// The Typesense-backed caseload search bar, end to end through the browser:
// CaseloadSelect renders what CaseloadSearchManager returns, and the manager only
// sees what the user's scoped keys permit.
//
// CaseloadScopedKey.spec.ts covers the scope permutations at the API layer. This
// file covers the two things only a browser shows: that the typeahead behaves
// (seeding, debounce, fuzzy matching, selection state), and that a user's scope
// is still enforced by the time it reaches the dropdown.

import { expect, Locator, Page, test } from "@playwright/test";

import { mockOfflineUser, type OfflineUserSpec } from "./utils";

const TYPESENSE_SEARCH = { typesenseCaseloadSearch: {} };
const UNRESTRICTED = { supervisionUnrestrictedSearch: {} };
const ID_DISTRICT_SEARCH = { usIdDistrictSearch: {} };

const SUPERVISION_ROUTES = { workflowsSupervision: true };

// Fixtures these tests join against live in the "Typesense scope permutations"
// block of libs/datatypes/.../Supervision/Workflows/fixture.ts.
const TN_OFFICER = {
  stateCode: "us_tn",
  externalId: "E2E_TN_OFFICER",
  email: "e2e-tn-officer@example.com",
} satisfies OfflineUserSpec;

const ID_OFFICER = {
  stateCode: "us_id",
  externalId: "E2E_ID_OFFICER",
  email: "e2e-id-officer@example.com",
} satisfies OfflineUserSpec;

const options = (page: Page) => page.locator(".CaseloadSelect__option");
const pills = (page: Page) =>
  page.locator(".CaseloadSelect__multi-value__label");

/** Mocks the user, lands on a workflows page, and opens the search menu. */
async function openSearch(
  page: Page,
  spec: OfflineUserSpec & { featureVariants: Record<string, unknown> },
  path = "/workflows/clients",
): Promise<Locator> {
  await mockOfflineUser(page, { routes: SUPERVISION_ROUTES, ...spec });
  await page.goto(path);

  return openMenu(page);
}

/** Waits for the search bar to mount, then opens its menu. */
async function openMenu(page: Page): Promise<Locator> {
  // Workflows hydrates from Firestore before the search bar mounts.
  await page.waitForSelector(".CaseloadSelect", { timeout: 30000 });

  const input = page.locator(".CaseloadSelect input").first();
  await input.click();
  return input;
}

/** Replaces the query a keystroke at a time, the way the debounce expects. */
async function search(input: Locator, query: string): Promise<void> {
  await input.fill("");
  await input.pressSequentially(query, { delay: 20 });
}

test.describe("caseload search — typeahead", () => {
  // The manager seeds the dropdown with an empty-query fetch on mount, so there
  // is something to show before the user types.
  test("offers options before anything is typed", async ({ page }) => {
    await openSearch(page, {
      ...TN_OFFICER,
      featureVariants: { ...TYPESENSE_SEARCH, ...UNRESTRICTED },
    });

    await expect(options(page).first()).toBeVisible();
    expect(await options(page).count()).toBeGreaterThan(1);
  });

  test("narrows to a match as the query is typed", async ({ page }) => {
    const input = await openSearch(page, {
      ...ID_OFFICER,
      featureVariants: { ...TYPESENSE_SEARCH, ...UNRESTRICTED },
    });

    await search(input, "Rourke");
    await expect(options(page)).toHaveText(["Thandeka Rourke"]);
  });

  // `infix: "always"` — a query matching the middle of a name still hits, which
  // a prefix-only index would miss.
  test("matches on a substring, not just a prefix", async ({ page }) => {
    const input = await openSearch(page, {
      ...ID_OFFICER,
      featureVariants: { ...TYPESENSE_SEARCH, ...UNRESTRICTED },
    });

    await search(input, "ourke");
    await expect(options(page)).toHaveText(["Thandeka Rourke"]);
  });

  // `num_typos: 2`
  test("tolerates a misspelling", async ({ page }) => {
    const input = await openSearch(page, {
      ...ID_OFFICER,
      featureVariants: { ...TYPESENSE_SEARCH, ...UNRESTRICTED },
    });

    await search(input, "Rorke");
    await expect(options(page)).toHaveText(["Thandeka Rourke"]);
  });

  test("shows an empty menu when nothing matches", async ({ page }) => {
    const input = await openSearch(page, {
      ...ID_OFFICER,
      featureVariants: { ...TYPESENSE_SEARCH, ...UNRESTRICTED },
    });

    await search(input, "zzzznope");
    await expect(options(page)).toHaveCount(0);
    // The dropdown is still mounted and usable, not an error state.
    await expect(page.locator(".CaseloadSelect")).toBeVisible();
  });
});

test.describe("caseload search — grouping and selection", () => {
  // Two search types active for one system, so each gets a heading taken from
  // its `searchTitle`. Locations sort ahead of staff.
  test("labels each search type and puts locations first", async ({ page }) => {
    await openSearch(page, {
      ...ID_OFFICER,
      featureVariants: {
        ...TYPESENSE_SEARCH,
        ...UNRESTRICTED,
        ...ID_DISTRICT_SEARCH,
      },
    });

    await expect(page.locator(".CaseloadSelect__group-heading")).toHaveText([
      "district",
      "supervision officer",
    ]);
    await expect(options(page).first()).toHaveText("District 1");
  });

  // FAILING — a real finding, not a flaky test. See the follow-up ticket.
  //
  // CaseloadSearchManager keeps a `searchableCache` precisely so a selected item
  // survives dropping out of `results`, and resolveSelectedSearchables reads
  // pills from that cache rather than from the current page of results. In the
  // browser it does not hold: select an officer, then search for a DIFFERENT
  // one, and the pill disappears.
  //
  // Confirmed not to be persistence or timing. The selection survives on its own
  // for 5+ seconds with no further queries, and the options assertion below
  // passes — so the second query lands, and only the pill is lost. Either the
  // cache is not being consulted or the entry is missing by then.
  test.fixme(
    "keeps a selection's pill after the results change",
    async ({ page }) => {
      const input = await openSearch(page, {
        ...ID_OFFICER,
        featureVariants: { ...TYPESENSE_SEARCH, ...UNRESTRICTED },
      });

      await search(input, "Rourke");
      await expect(options(page)).toHaveText(["Thandeka Rourke"]);
      await options(page).first().click();
      await expect(pills(page)).toHaveText(["Thandeka Rourke"]);

      // Searching for a different officer replaces `results` with a page that does
      // not contain the selected one, so the pill can only still be rendering
      // because it resolved out of the cache.
      await search(input, "Schroeder");
      await expect(options(page)).toHaveText(["Hank Schroeder"]);
      await expect(pills(page)).toHaveText(["Thandeka Rourke"]);
    },
  );
});

test.describe("caseload search — scope reaches the dropdown", () => {
  // The scoped key is minted per collection and its filter_by is baked in, so
  // the dropdown can only ever offer what the key permits. Both peers below are
  // US_TN supervision staff; only the one sharing a district is offered.
  test("a district-scoped user is offered only their district", async ({
    page,
  }) => {
    await openSearch(page, {
      ...TN_OFFICER,
      featureVariants: TYPESENSE_SEARCH,
    });

    const texts = await options(page).allTextContents();
    // E2E DISTRICT 1: the user plus one peer.
    expect(texts).toContain("Rosalind Ashwood");
    expect(texts).toContain("Marisol Quist");
    // E2E DISTRICT 2 and 3, and the unrelated demo fixture.
    expect(texts).not.toContain("Booker Nyland");
    expect(texts).not.toContain("Idris Vantol");
    expect(texts).not.toContain("Shayla Rice");
  });

  test("the unrestricted variant widens the same dropdown", async ({
    page,
  }) => {
    await openSearch(page, {
      ...TN_OFFICER,
      featureVariants: { ...TYPESENSE_SEARCH, ...UNRESTRICTED },
    });

    const texts = await options(page).allTextContents();
    expect(texts).toContain("Rosalind Ashwood");
    expect(texts).toContain("Booker Nyland");
    expect(texts).toContain("Idris Vantol");
  });

  // An own-caseload scope has no district to project onto a location, so the
  // locations key fails closed. With district search on, the group is simply
  // absent rather than showing every district in the state.
  test("an own-caseload user is offered no districts", async ({ page }) => {
    await openSearch(page, {
      ...ID_OFFICER,
      featureVariants: { ...TYPESENSE_SEARCH, ...ID_DISTRICT_SEARCH },
    });

    await expect(options(page).first()).toBeVisible();
    const texts = await options(page).allTextContents();
    expect(texts).toEqual(["Thandeka Rourke"]);
    await expect(page.locator(".CaseloadSelect__group-heading")).toHaveCount(0);
  });
});

// US_ID is the one tenant configuring a search type per system that is gated by
// its own feature variant, so it is where the per-system fan-out is visible:
// supervision searches districts and officers, incarceration searches Community
// Reentry Center facilities, and the ALL page searches all of them at once.
test.describe("caseload search — search types per system", () => {
  const ALL_ID_SEARCH_TYPES = {
    ...TYPESENSE_SEARCH,
    ...UNRESTRICTED,
    ...ID_DISTRICT_SEARCH,
    usIdCRCFacilitySearch: {},
    usIdCaseManagerSearch: {},
  };
  const BOTH_SYSTEM_ROUTES = {
    workflowsSupervision: true,
    workflowsFacilities: true,
  };
  const ID_USER = {
    ...ID_OFFICER,
    routes: BOTH_SYSTEM_ROUTES,
    featureVariants: ALL_ID_SEARCH_TYPES,
  };

  const CRC_FACILITIES = ["Phobos Reentry Center", "Lunar Reentry Center"];

  test("the supervision page searches districts and officers", async ({
    page,
  }) => {
    await openSearch(page, ID_USER, "/workflows/clients");

    await expect(page.locator(".CaseloadSelect__placeholder")).toHaveText(
      "Search for a district or supervision officer …",
    );
    await expect(page.locator(".CaseloadSelect__group-heading")).toHaveText([
      "district",
      "supervision officer",
    ]);

    const texts = await options(page).allTextContents();
    expect(texts).toContain("District 1");
    expect(texts).toContain("Thandeka Rourke");
    // Incarceration-side options belong to the other system.
    CRC_FACILITIES.forEach((facility) => expect(texts).not.toContain(facility));
  });

  test("the incarceration page searches CRC facilities", async ({ page }) => {
    await openSearch(page, ID_USER, "/workflows/residents");

    await expect(page.locator(".CaseloadSelect__placeholder")).toHaveText(
      "Search for a facility or case manager …",
    );
    expect((await options(page).allTextContents()).sort()).toEqual(
      [...CRC_FACILITIES].sort(),
    );
  });

  // The CRC search filters `idType:=crcFacilityId`, so an ordinary facility in
  // the same state and system stays out of it. Both live in the `locations`
  // collection, and only the idType separates them.
  test("CRC search excludes facilities of another idType", async ({ page }) => {
    await openSearch(page, ID_USER, "/workflows/residents");

    const texts = await options(page).allTextContents();
    // A US_ID `facilityId` location, not a `crcFacilityId` one.
    expect(texts).not.toContain("Lunar Penal Colony");
  });

  test("a CRC facility is reachable by name", async ({ page }) => {
    const input = await openSearch(page, ID_USER, "/workflows/residents");

    await search(input, "Phobos");
    await expect(options(page)).toHaveText(["Phobos Reentry Center"]);
  });

  // `/workflows/home` is the ALL page, where the plan fans out across both
  // systems and every configured search type appears under its own heading.
  test("the ALL page searches every configured type at once", async ({
    page,
  }) => {
    await openSearch(page, ID_USER, "/workflows/home");

    await expect(page.locator(".CaseloadSelect__placeholder")).toHaveText(
      "Search for a district, supervision officer, facility, or case manager …",
    );
    await expect(page.locator(".CaseloadSelect__group-heading")).toHaveText([
      "district",
      "facility",
      "supervision officer",
    ]);

    const texts = await options(page).allTextContents();
    expect(texts).toContain("District 1");
    expect(texts).toContain("Thandeka Rourke");
    CRC_FACILITIES.forEach((facility) => expect(texts).toContain(facility));
  });

  // Navigated in-app rather than reloaded, so this exercises the reaction that
  // re-mints the scoped keys and reseeds the dropdown when `activeSystem`
  // changes. A stale key would keep offering the previous system's options.
  test("moving between systems swaps the available options", async ({
    page,
  }) => {
    await openSearch(page, ID_USER, "/workflows/clients");
    expect(await options(page).allTextContents()).toContain("Thandeka Rourke");

    await page.click('a[href*="/workflows/residents"]');
    await openMenu(page);
    await expect(page.locator(".CaseloadSelect__placeholder")).toHaveText(
      "Search for a facility or case manager …",
    );

    const afterSwitch = await options(page).allTextContents();
    CRC_FACILITIES.forEach((facility) =>
      expect(afterSwitch).toContain(facility),
    );
    expect(afterSwitch).not.toContain("Thandeka Rourke");
    expect(afterSwitch).not.toContain("District 1");
  });
});
