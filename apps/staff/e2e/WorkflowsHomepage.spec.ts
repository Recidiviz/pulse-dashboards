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

// Homepage parity: the Typesense-backed counts must match the Firestore ones.
//
// Asserts the two paths agree rather than asserting a number, so the spec does
// not restate `countByFunction`. README-homepage-counts.md has the permutation
// table and why each known failure fails.

import { expect, Locator, Page, test } from "@playwright/test";

import { mockOfflineUser, type OfflineUserSpec } from "./utils";

/** Both runs keep the Typesense SEARCH BAR on, so each picks the same caseload. */
const SEARCH_ONLY = { typesenseCaseloadSearch: {} };
const SEARCH_AND_HOMEPAGE = {
  typesenseCaseloadSearch: {},
  typesenseHomepage: {},
};

/**
 * Makes every synthetic user unique to THIS invocation. A selection persists to
 * `userUpdates` in the emulator, which outlives the run, so a fixed address
 * would load the previous invocation's caseload instead of selecting one.
 */
const RUN_ID = Date.now().toString(36);

const ROUTES = {
  workflows: true,
  workflowsSupervision: true,
  workflowsFacilities: true,
  tasks: true,
};

type HomepageCase = {
  tenant: string;
  /**
   * A staff member the tenant's search can resolve. Required wherever the
   * `staffFilterFn` narrows the dropdown by the user's own record: without it
   * the menu is empty and there is nothing to compare. Omitted for the
   * facility-search tenants, whose dropdown lists locations.
   */
  externalId?: string;
  /**
   * The caseload to select, by the name the dropdown shows. Set it wherever
   * the first option the dropdown offers holds no records.
   */
  searchFor?: string;
  /** Why this one is its own row. See the permutation table. */
  shape: string;
  /**
   * A parity bug this case exercises. Set means `test.fixme`: the case stays
   * listed and stays unrun until its ticket lands.
   */
  knownFailure?: string;
};

const CASES: HomepageCase[] = [
  {
    tenant: "us_ar",
    // Both residents with an opportunity sit in FACILITY1. The dropdown offers
    // Upstate Facility (FACILITY2) first, which holds none of them.
    searchFor: "Central Prison",
    shape: "DEFAULT - facility search",
  },
  {
    tenant: "us_az",
    externalId: "OFFICER1",
    shape: "SINGLE_TAB - Eligible per ORAS",
  },
  {
    tenant: "us_ca",
    externalId: "OFFICER1",
    shape: "DEFAULT",
  },
  {
    tenant: "us_ia",
    externalId: "OFFICER1",
    shape: "TAB_SUBSET - Pending Eligibility + Eligible Now",
    // TODO(OBT-50232): the Typesense path also counts `Downgraded` and
    // `Snoozed`, which `countByFunction` leaves out.
    knownFailure: "OBT-50232",
  },
  { tenant: "us_id", externalId: "OFFICER6", shape: "DEFAULT" },
  { tenant: "us_mi", externalId: "OFFICER8", shape: "DEFAULT" },
  {
    tenant: "us_mo",
    shape: "DYNAMIC_TAB - Overdue as of <date>",
    // TODO(OBT-50229): counts `Overridden` and `Missing Review Date` too, and
    // the `Overdue as of <date>` label is derived from the record, so the two
    // paths have to reconstruct it identically.
    knownFailure: "OBT-50229",
  },
  {
    tenant: "us_nc",
    externalId: "NCOFFICER1",
    searchFor: "Nathalie Giles",
    shape: "DEFAULT + tabGroups override",
  },
  {
    tenant: "us_nd",
    externalId: "OFFICER3",
    shape: "DEFAULT",
    // TODO(OBT-52517): tab counts agree; the headline does not. `Referral
    // Submitted` is dropped by Firestore and summed by the census.
    knownFailure: "OBT-52517",
  },
  {
    tenant: "us_ne",
    externalId: "NEOFFICER1",
    shape: "DEFAULT",
    // TODO(OBT-52517): same as US_ND, with `Pending` as the excluded tab.
    knownFailure: "OBT-52517",
  },
  {
    tenant: "us_or",
    externalId: "271828",
    shape: "DISTINCT_PEOPLE - dedupes by person",
    // TODO(OBT-52519): the only shape that diverges even when every record is
    // on a displayed tab. The census counts documents, not people.
    knownFailure: "OBT-52519",
  },
  {
    tenant: "us_pa",
    externalId: "OFFICER1",
    shape: "DEFAULT + tabGroups override",
  },
  {
    tenant: "us_tn",
    externalId: "E2E_TN_OFFICER",
    shape: "DEFAULT - widest type set (14)",
  },
  {
    tenant: "us_tx",
    externalId: "OFFICER1",
    shape: "TAB_SUBSET - Eligible Now + Almost Eligible + Awaiting Revisions",
    // TODO(OBT-52520): adds `Submitted for Review`, `Approved in OIMS` and
    // `Marked Ineligible`. The tenant also enables the V1 AND V2 type of each
    // opportunity, which the ticket tracks separately.
    knownFailure: "OBT-52520",
  },
  {
    tenant: "us_ut",
    externalId: "UTOFFICER1",
    searchFor: "Sunny Campana",
    shape: "SINGLE_TAB - Suitable for Early Termination",
    // TODO(OBT-52518): Firestore reports 3, the census 5. `countByFunction`
    // counts one named tab; the census sums them all.
    knownFailure: "OBT-52518",
  },
];

type Snapshot = {
  /** Each card's header line, which carries the headline count. */
  headers: string[];
  /** Every `Label: N` the cards render — the per-tab counts. */
  tabCounts: Record<string, number>;
  /** Census calls the page made. Must not scale with the caseload. */
  searchRequests: number;
  /** How many caseloads ended up selected. */
  pillCount: number;
  /**
   * Under-fetch warnings. The census and the acted-on fetch are both paged, and
   * overflowing either inflates the NONE buckets by exactly the number missed —
   * silently. The unit tests cover the warning firing; this proves the fixtures
   * stay under the cap, so a growing fixture set cannot quietly break parity.
   */
  paginationWarnings: string[];
};

/**
 * Opens the caseload menu and waits for it to hold something.
 *
 * Retries rather than polling a single click: the select mounts before its
 * options load, and a menu opened in that window stays empty instead of
 * refilling, so waiting on the first attempt would wait forever.
 */
async function openMenu(
  page: Page,
  input: Locator,
  options: Locator,
): Promise<void> {
  await expect
    .poll(
      async () => {
        await input.click();
        const count = await options.count();
        if (count === 0) await page.keyboard.press("Escape");
        return count;
      },
      { timeout: 45000, intervals: [500, 1000, 2000, 3000] },
    )
    .toBeGreaterThan(0);
}

/**
 * The page text, once it stops changing.
 *
 * Both paths fill their counts asynchronously, and the two settle at different
 * moments. Reading on a fixed delay either races the slower one or pads every
 * case by the worst case, so this waits for two identical reads instead.
 */
async function settledText(page: Page): Promise<string> {
  let previous = "";
  await expect
    .poll(
      async () => {
        const current = await page.locator("body").innerText();
        const stable = current === previous && current.length > 0;
        previous = current;
        return stable;
      },
      { timeout: 45000, intervals: [1000] },
    )
    .toBe(true);
  return previous;
}

/** How many caseloads the scale case selects. */
const SCALE_SELECTION = 3;

/**
 * Loads the homepage, selects a caseload, and reads what the cards show.
 */
async function snapshotHomepage(
  page: Page,
  spec: OfflineUserSpec,
  featureVariants: Record<string, unknown>,
  searchFor?: string,
  selectCount = 1,
): Promise<Snapshot> {
  let searchRequests = 0;
  const paginationWarnings: string[] = [];
  page.on("request", (r) => {
    // ONLY the census, by the collection it names in its body. Counting every
    // Typesense call would include the caseload search bar's typeahead, which
    // fires once per selection — so a wider selection would look like fan-out
    // when it is the user typing.
    if (!/multi_search|documents\/search/.test(r.url())) return;
    if (r.postData()?.includes('"collection":"opportunities"')) {
      searchRequests += 1;
    }
  });
  page.on("console", (m) => {
    if (/needs pagination/.test(m.text())) paginationWarnings.push(m.text());
  });

  await mockOfflineUser(page, { routes: ROUTES, ...spec, featureVariants });
  await page.goto("/workflows/home");
  await page.waitForSelector(".CaseloadSelect", { timeout: 30000 });

  const pills = page.locator(".CaseloadSelect__multi-value__label");
  const input = page.locator(".CaseloadSelect input").first();
  const options = page.locator(".CaseloadSelect__option");

  // Nothing is selected yet. Clearing a selection through the UI is not an
  // option: the typeahead drops keystrokes typed into a just-cleared select.
  await openMenu(page, input, options);

  if (searchFor) {
    // The dropdown lists facilities before officers, and the fixtures hang
    // their records off the officers, so the first option is an empty caseload.
    await input.pressSequentially(searchFor, { delay: 25 });
    await expect
      .poll(() => options.allTextContents(), { timeout: 20000 })
      .toEqual(expect.arrayContaining([expect.stringContaining(searchFor)]));
  }

  // The MATCHING option, not the first one. The typeahead is fuzzy
  // (`num_typos: 2`), so a facility can still outrank the name just typed.
  const target = searchFor
    ? options.filter({ hasText: searchFor }).first()
    : options.first();
  await target.click();

  // Additional caseloads for the scale case. A single officer passes whether or
  // not the page fans out, so only a wider selection proves anything.
  //
  // The menu re-queries Typesense after each pick, so the options have to be
  // waited for. Checking immediately finds an empty list and selects nothing.
  for (let i = 1; i < selectCount; i += 1) {
    // eslint-disable-next-line no-await-in-loop -- each pick depends on the menu the last one left
    await input.click();
    // eslint-disable-next-line no-await-in-loop
    const opened = await options
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) break;
    // eslint-disable-next-line no-await-in-loop
    await options.first().click();
    // eslint-disable-next-line no-await-in-loop
    await expect.poll(() => pills.count(), { timeout: 15000 }).toBe(i + 1);
  }
  await page.keyboard.press("Escape");

  await expect.poll(() => pills.count(), { timeout: 20000 }).toBeGreaterThan(0);

  const text = await settledText(page);

  const tabCounts: Record<string, number> = {};
  for (const [, label, n] of text.matchAll(
    /^([A-Za-z][^:\n]{2,40}): (\d+)$/gm,
  )) {
    tabCounts[label.trim()] = Number(n);
  }

  const headers = text
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) => /\b\d+\b/.test(l) && /client|resident|people|caseload/i.test(l),
    );

  return {
    headers,
    tabCounts,
    searchRequests,
    paginationWarnings,
    pillCount: await pills.count(),
  };
}

for (const { tenant, externalId, searchFor, shape, knownFailure } of CASES) {
  const title = `${tenant.toUpperCase()} — ${shape}`;
  const spec: OfflineUserSpec = {
    stateCode: tenant,
    ...(externalId ? { externalId } : {}),
  };

  const run = knownFailure ? test.fixme : test;

  run(`${title}: counts match across the gate`, async ({ page }) => {
    test.setTimeout(180000);

    // A distinct synthetic user per run. See RUN_ID.
    const firestore = await snapshotHomepage(
      page,
      { ...spec, email: `e2e-${tenant}-firestore-${RUN_ID}@example.com` },
      SEARCH_ONLY,
      searchFor,
    );
    const typesense = await snapshotHomepage(
      page,
      { ...spec, email: `e2e-${tenant}-typesense-${RUN_ID}@example.com` },
      SEARCH_AND_HOMEPAGE,
      searchFor,
    );

    // Logged so a mismatch names the tenant without reading the trace.
    console.warn(`  [${tenant}] firestore tabs:`, firestore.tabCounts);
    console.warn(`  [${tenant}] typesense tabs:`, typesense.tabCounts);

    // Two empty snapshots agree with each other and prove nothing. Every
    // tenant in CASES has records reachable from the caseload `searchFor`
    // names, so an empty Firestore side means the spec selected the wrong one.
    expect(
      Object.keys(firestore.tabCounts).length,
      "Firestore side rendered no cards; check this case's searchFor",
    ).toBeGreaterThan(0);

    // Neither paging cap was hit, so the counts below are the whole set.
    expect(firestore.paginationWarnings).toEqual([]);
    expect(typesense.paginationWarnings).toEqual([]);

    expect(typesense.tabCounts).toEqual(firestore.tabCounts);
    expect(typesense.headers).toEqual(firestore.headers);
  });
}

/**
 * AC#1 of the epic: the homepage must not fan out per person, and it holds
 * parity at a selection wider than one officer.
 *
 * US_ID is the widest passing tenant — 9 types, two officers with clients.
 */
test("a wider selection neither fans out nor breaks parity", async ({
  page,
}) => {
  test.setTimeout(240000);

  const spec: OfflineUserSpec = {
    stateCode: "us_id",
    externalId: "OFFICER6",
  };

  const one = await snapshotHomepage(
    page,
    { ...spec, email: `e2e-scale-one-${RUN_ID}@example.com` },
    SEARCH_AND_HOMEPAGE,
    undefined,
    1,
  );
  const many = await snapshotHomepage(
    page,
    { ...spec, email: `e2e-scale-many-${RUN_ID}@example.com` },
    SEARCH_AND_HOMEPAGE,
    undefined,
    SCALE_SELECTION,
  );
  const manyFirestore = await snapshotHomepage(
    page,
    { ...spec, email: `e2e-scale-firestore-${RUN_ID}@example.com` },
    SEARCH_ONLY,
    undefined,
    SCALE_SELECTION,
  );

  console.warn(
    `  [scale] pills one=${one.pillCount} many=${many.pillCount}` +
      `  requests one=${one.searchRequests} many=${many.searchRequests}` +
      `  tabs(one)=${JSON.stringify(one.tabCounts)}` +
      `  tabs(many)=${JSON.stringify(many.tabCounts)}`,
  );

  // THE point (AC#1). The old path issued one opportunity fetch per PERSON, so
  // its count grew with the caseload. The census is one `multi_search` per
  // selection change, so the ceiling is the selection changes plus the mount.
  //
  // Not `many <= one`: a census re-run on a selection change is correct.
  expect(many.pillCount).toBeGreaterThan(one.pillCount);
  expect(many.searchRequests).toBeLessThanOrEqual(SCALE_SELECTION + 1);

  expect(many.paginationWarnings).toEqual([]);
  expect(many.tabCounts).toEqual(manyFirestore.tabCounts);
  expect(many.headers).toEqual(manyFirestore.headers);
});
