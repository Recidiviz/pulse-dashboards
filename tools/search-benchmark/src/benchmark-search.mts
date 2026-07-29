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

/**
 * Benchmark harness: facility opportunity search
 *
 *   1. Start already-authenticated (see capture-auth-state.mts)
 *   2. Land on profile page -> select a state ("Arizona") -> state overview
 *   3. Top-bar nav -> Opportunities page
 *   4. Search the facility dropdown for a name ("LEWIS")
 *   5. Wait for results to actually finish rendering
 *
 * Usage:
 *   nx run tools:search-benchmark-benchmark -- --trials=5 --label=firestore --state=AZ --facility=LEWIS
 *   nx run tools:search-benchmark-benchmark -- --trials=5 --label=typesense --state=AZ --facility=LEWIS
 */

import fs from "fs";
import path from "path";
import puppeteer, { type Browser, type CDPSession, type Page } from "puppeteer";

import { AUTH_STATE_PATH, DEFAULT_BASE_URL, RESULTS_DIR } from "./config.mts";

const SELECTORS = {
  // profile page: one button per state, e.g. StateSelection__US_AZ, __US_IX
  stateButton: (stateCode: string) =>
    `button.StateSelection__select-item.StateSelection__US_${stateCode}`,

  // top-bar nav: "Opportunities" tab (href varies by tenant, e.g. /workflows/home vs /workflows/opportunities)
  opportunitiesNavLink: 'a[role="menuitem"]::-p-text(Opportunities)',

  // react-select "CaseloadSelect" facility/caseload search
  caseloadSearchInput: ".CaseloadSelect__input-container input",
  caseloadMenu: ".CaseloadSelect__menu",
  caseloadOption: ".CaseloadSelect__option",
  // clears any previously-selected facilities/caseloads (selection persists in
  // Firestore per-user, so a fresh browser context does NOT reset it)
  caseloadClearIndicator: ".CaseloadSelect__clear-indicator",

  // swaps Hydrator__StatusWrapper spinner for Hydrator__ContentWrapper once rendered
  loadingSpinner: '[class*="Hydrator__StatusWrapper"]',
  resultsContainer: '[class*="WorkflowsResults__WorkflowsResultsWrapper"]',

  // look for opportunity cards to appear
  resultsCard: '[class*="WorkflowsHomepageSummary__HomepageSummaryLink"]',
};

interface AuthState {
  cookies?: Parameters<Page["setCookie"]>[0][];
  localStorage?: Record<string, string>;
}

interface FirestoreErrorEntry {
  type: string;
  text: string;
}

interface Measures {
  "time-to-opportunities-page": number;
  "search-duration": number;
  "total-flow-duration": number;
}

interface TrialResultBase {
  trial: number;
  label: string;
  firestoreErrors: FirestoreErrorEntry[];
}

interface TrialSuccess extends TrialResultBase {
  ok: true;
  measures: Measures;
  heapBaselineMB: number;
  heapAfterSearchMB: number;
  heapDeltaMB: number;
  heapPeakMB: number;
}

interface TrialFailure extends TrialResultBase {
  ok: false;
  error: string;
}

type TrialResult = TrialSuccess | TrialFailure;

function isTrialSuccess(result: TrialResult): result is TrialSuccess {
  return result.ok;
}

interface Metric {
  median: number | null;
  p95: number | null;
  min: number | null;
  max: number | null;
}

interface Summary {
  label: string;
  trials: number;
  successes: number;
  failures: number;
  searchDurationMs: Metric;
  timeToOpportunitiesPageMs: Metric;
  totalFlowDurationMs: Metric;
  heapDeltaMB: Metric;
  heapAfterSearchMB: Metric;
  heapPeakMB: Metric;
  firestoreErrors: number;
}

function arg(name: string): string | undefined;
function arg(name: string, fallback: string): string;
function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.findIndex((a) => a.startsWith(`--${name}=`));
  const first = idx === -1 ? undefined : process.argv[idx];
  if (first === undefined) return fallback;

  // facility names (and other values) can contain spaces/commas
  const parts = [first.split("=").slice(1).join("=")];
  for (let i = idx + 1; i < process.argv.length; i++) {
    const next = process.argv[i];
    if (next === undefined || next.startsWith("--")) break;
    parts.push(next);
  }
  return parts.join(" ");
}

function timestampForFilename(): string {
  return new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
}

function slugify(value: string): string {
  return value
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const state = arg("state");
const facilityQuery = arg("facility");
const label = arg("label", "run");

if (!state || !facilityQuery) {
  console.error(
    "Usage: nx run tools:search-benchmark-benchmark -- --state=<STATE_CODE> --facility=<FACILITY_QUERY> [options]",
  );
  process.exit(1);
}

const CONFIG = {
  baseUrl: arg("url", DEFAULT_BASE_URL),
  authStatePath: AUTH_STATE_PATH,
  state,
  facilityQuery,
  trials: parseInt(arg("trials", "5"), 10),
  label,
  cpuThrottleRate: parseFloat(arg("cpu-throttle", "1")), // 1 = no throttling, 4 = 4x slower
  navTimeoutMs: 30000,
  interactionTimeoutMs: 20000,
  searchTimeoutMs: 120000, // 2 min
  trialTimeoutMs: 180000, // 3 min
  heapSampleIntervalMs: parseInt(arg("heap-sample-interval", "200"), 10),
  outputPath: path.join(
    RESULTS_DIR,
    `results-${label}-${state}-${slugify(facilityQuery)}-${timestampForFilename()}.json`,
  ),
};

// performance.memory (Chrome-only, non-standard) matches what the Performance
// panel / Task Manager show; the CDP Runtime.getHeapUsage number reads
// noticeably lower and doesn't line up with manual dev-tools measurements
async function readHeapUsedMB(page: Page): Promise<number> {
  const usedBytes = await page.evaluate(
    () =>
      (performance as Performance & { memory: { usedJSHeapSize: number } })
        .memory.usedJSHeapSize,
  );
  return usedBytes / 1e6;
}

async function forceGCAndReadHeap(
  client: CDPSession,
  page: Page,
): Promise<{ usedMB: number }> {
  await client.send("HeapProfiler.enable");
  await client.send("HeapProfiler.collectGarbage");
  const usedMB = await readHeapUsedMB(page);
  return { usedMB };
}

// polls on an interval, without forcing GC, to catch peak heap usage
function startHeapSampling(page: Page, intervalMs: number) {
  let peakUsedMB = 0;
  let stopped = false;
  const timer = setInterval(() => {
    if (stopped) return;
    readHeapUsedMB(page)
      .then((usedMB) => {
        peakUsedMB = Math.max(peakUsedMB, usedMB);
      })
      .catch(() => {
        // failures mid-navigation are fine to skip
      });
  }, intervalMs);
  return {
    stop() {
      if (stopped) return { peakUsedMB };
      stopped = true;
      clearInterval(timer);
      return { peakUsedMB };
    },
  };
}

// updateSelectedSearch() writes to Firestore keyed on the user's account, so
// it survives a fresh browserContext; without clearing it, each subsequent
// trial's search adds one more chip on top of whatever this run left selected.
async function clearCaseloadSelection(page: Page): Promise<void> {
  const clearIndicator = await page
    .waitForSelector(SELECTORS.caseloadClearIndicator, { timeout: 3000 })
    .catch(() => null);
  if (!clearIndicator) return;
  await clearIndicator.click();
  await page.waitForFunction(
    (sel) => !document.querySelector(sel),
    { timeout: CONFIG.interactionTimeoutMs },
    SELECTORS.caseloadClearIndicator,
  );
}

async function runTrial(
  browser: Browser,
  trialIndex: number,
): Promise<TrialResult> {
  let context;
  let page: Page | undefined;
  let heapSampler: ReturnType<typeof startHeapSampling> | undefined;
  let succeeded = false;
  const firestoreErrors: FirestoreErrorEntry[] = [];

  try {
    context = await browser.createBrowserContext(); // isolated per trial: no shared cache/storage
    page = await context.newPage();
    const client = await page.createCDPSession();

    await page.setCacheEnabled(false);
    await page.setBypassServiceWorker(true);
    page.setDefaultTimeout(CONFIG.navTimeoutMs);

    if (CONFIG.cpuThrottleRate !== 1) {
      await client.send("Emulation.setCPUThrottlingRate", {
        rate: CONFIG.cpuThrottleRate,
      });
    }

    heapSampler = startHeapSampling(page, CONFIG.heapSampleIntervalMs);

    // crash detection — treat as a failed trial
    let crashed = false;
    page.on("error", () => {
      crashed = true;
    });
    browser.on("disconnected", () => {
      crashed = true;
    });

    // Firestore SDK logs resource-exhausted/backoff errors to the console
    // when a client exceeds quota
    let onFirestoreError: ((entry: FirestoreErrorEntry) => void) | null = null;
    page.on("console", (msg) => {
      if (msg.type() !== "error" && msg.type() !== "warn") return;
      const text = msg.text();
      if (
        /firestore|firebase|resource-exhausted|too many outstanding requests|maximum backoff delay/i.test(
          text,
        )
      ) {
        const entry = { type: msg.type(), text };
        firestoreErrors.push(entry);
        if (onFirestoreError) onFirestoreError(entry);
      }
    });

    // --- load auth state ---
    if (!fs.existsSync(CONFIG.authStatePath)) {
      throw new Error(
        "auth-state.json not found — run capture-auth-state.mts first",
      );
    }
    const authState: AuthState = JSON.parse(
      fs.readFileSync(CONFIG.authStatePath, "utf8"),
    );
    if (authState.cookies?.length) await page.setCookie(...authState.cookies);

    await page.goto(CONFIG.baseUrl, { waitUntil: "networkidle0" });
    await page.evaluate((ls) => {
      for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v);
    }, authState.localStorage || {});

    // --- baseline heap ---
    await page.goto(`${CONFIG.baseUrl}/profile`, { waitUntil: "networkidle0" });
    if (crashed) throw new Error("page crashed during initial load");
    const heapBaseline = await forceGCAndReadHeap(client, page);
    await page.evaluate(() => performance.mark("flow-start"));

    // --- select state ---
    // wait on /workflows/home?tenantId=US_{code}
    // networkidle0 above only means the network went quiet — the state button
    // list can still be mid-render (e.g. late client-side fetch), so wait for
    // it explicitly rather than clicking right away
    await page.waitForSelector(SELECTORS.stateButton(CONFIG.state), {
      timeout: CONFIG.interactionTimeoutMs,
    });
    await page.click(SELECTORS.stateButton(CONFIG.state));
    await page.waitForFunction(
      (code) => window.location.href.includes(`tenantId=US_${code}`),
      { timeout: CONFIG.interactionTimeoutMs },
      CONFIG.state,
    );
    await page.evaluate(() => performance.mark("state-selected"));

    // --- nav to opportunities ---
    await page.waitForSelector(SELECTORS.opportunitiesNavLink, {
      timeout: CONFIG.interactionTimeoutMs,
    });
    await page.click(SELECTORS.opportunitiesNavLink);
    await page.waitForFunction(
      () => window.location.pathname.startsWith("/workflows/"),
      {
        timeout: CONFIG.interactionTimeoutMs,
      },
    );
    await page.waitForSelector(SELECTORS.caseloadSearchInput, {
      timeout: CONFIG.interactionTimeoutMs,
    });
    await page.evaluate(() => performance.mark("opportunities-page-ready"));

    // --- facility search ---
    // CaseloadSelect is a react-select combobox
    // type full name + select first result
    await page.click(SELECTORS.caseloadSearchInput);
    await page.type(SELECTORS.caseloadSearchInput, CONFIG.facilityQuery, {
      delay: 30,
    });
    await page.waitForSelector(SELECTORS.caseloadMenu, {
      timeout: CONFIG.interactionTimeoutMs,
    });
    const firstOption = await page.waitForSelector(SELECTORS.caseloadOption, {
      timeout: CONFIG.interactionTimeoutMs,
    });
    if (!firstOption) throw new Error("facility search returned no options");

    await firstOption.click();
    await page.evaluate(() => performance.mark("search-start"));

    // abort the search wait immediately on a Firestore quota/backoff error
    // instead of letting the trial run to timeout on bad data
    const firestoreErrorDuringSearch = new Promise<never>((_, reject) => {
      onFirestoreError = (entry) =>
        reject(
          new Error(
            `Firestore error during search: [${entry.type}] ${entry.text}`,
          ),
        );
    });

    // wait for the app's own data-loading signal: spinner (Hydrator__StatusWrapper)
    // gone AND at least one opportunity card actually rendered
    try {
      await Promise.race([
        page.waitForFunction(
          (spinnerSel, resultsSel, cardSel) =>
            !document.querySelector(spinnerSel) &&
            document.querySelector(resultsSel) &&
            document.querySelectorAll(cardSel).length > 0,
          { timeout: CONFIG.searchTimeoutMs },
          SELECTORS.loadingSpinner,
          SELECTORS.resultsContainer,
          SELECTORS.resultsCard,
        ),
        firestoreErrorDuringSearch,
      ]);
    } finally {
      onFirestoreError = null;
    }
    if (crashed) throw new Error("page crashed during search");
    await page.evaluate(() => performance.mark("search-end"));

    // cards passing our wait condition doesn't mean the DOM/React work is
    // fully settled — keep the sampler running a bit longer so heapPeak
    // catches any post-render tail instead of stopping right at search-end
    await new Promise((resolve) =>
      setTimeout(resolve, CONFIG.heapSampleIntervalMs * 5),
    );

    // --- clear the selection this trial made ---
    // clearing after search-end keeps it out of the timing measures; the
    // finally block below covers the case where we throw before reaching here
    await clearCaseloadSelection(page);

    // --- extract timings ---
    const measures = await page.evaluate((): Measures => {
      performance.measure(
        "time-to-opportunities-page",
        "flow-start",
        "opportunities-page-ready",
      );
      performance.measure("search-duration", "search-start", "search-end");
      performance.measure("total-flow-duration", "flow-start", "search-end");
      const byName = new Map(
        performance
          .getEntriesByType("measure")
          .map((e) => [e.name, e.duration]),
      );
      return {
        "time-to-opportunities-page":
          byName.get("time-to-opportunities-page") ?? 0,
        "search-duration": byName.get("search-duration") ?? 0,
        "total-flow-duration": byName.get("total-flow-duration") ?? 0,
      };
    });

    const heapAfterSearch = await forceGCAndReadHeap(client, page);
    const { peakUsedMB } = heapSampler.stop();

    succeeded = true;
    return {
      trial: trialIndex,
      label: CONFIG.label,
      ok: true,
      measures,
      heapBaselineMB: heapBaseline.usedMB,
      heapAfterSearchMB: heapAfterSearch.usedMB,
      heapDeltaMB: heapAfterSearch.usedMB - heapBaseline.usedMB,
      heapPeakMB: peakUsedMB,
      firestoreErrors,
    };
  } catch (err) {
    return {
      trial: trialIndex,
      label: CONFIG.label,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      firestoreErrors,
    };
  } finally {
    if (heapSampler) heapSampler.stop();
    // if we threw before the in-flow clear ran, this leaves the selection
    // clean for the next trial anyway
    if (page && !succeeded)
      await clearCaseloadSelection(page).catch(() => undefined);
    if (context) await context.close().catch(() => undefined);
  }
}

function percentile(sortedArr: number[], p: number): number | null {
  if (!sortedArr.length) return null;
  const idx = Math.min(sortedArr.length - 1, Math.floor(sortedArr.length * p));
  return sortedArr[idx] ?? null;
}

function summarize(results: TrialResult[]): Summary {
  const ok = results.filter(isTrialSuccess);
  const metric = (fn: (r: TrialSuccess) => number): Metric => {
    const vals = ok.map(fn).sort((a, b) => a - b);
    return {
      median: percentile(vals, 0.5),
      p95: percentile(vals, 0.95),
      min: vals[0] ?? null,
      max: vals.at(-1) ?? null,
    };
  };

  return {
    label: CONFIG.label,
    trials: results.length,
    successes: ok.length,
    failures: results.length - ok.length,
    searchDurationMs: metric((r) => r.measures["search-duration"]),
    timeToOpportunitiesPageMs: metric(
      (r) => r.measures["time-to-opportunities-page"],
    ),
    totalFlowDurationMs: metric((r) => r.measures["total-flow-duration"]),
    heapDeltaMB: metric((r) => r.heapDeltaMB),
    heapAfterSearchMB: metric((r) => r.heapAfterSearchMB),
    heapPeakMB: metric((r) => r.heapPeakMB),
    firestoreErrors: results.reduce(
      (sum, r) => sum + r.firestoreErrors.length,
      0,
    ),
  };
}

(async () => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  console.log(
    `Running ${CONFIG.trials} trials — label: "${CONFIG.label}", state: ${CONFIG.state}, facility: "${CONFIG.facilityQuery}"`,
  );
  const browser = await puppeteer.launch({ headless: false });
  const results: TrialResult[] = [];

  for (let i = 0; i < CONFIG.trials; i++) {
    // eslint-disable-next-line no-await-in-loop -- trials must run sequentially, not concurrently
    const trial = await Promise.race([
      runTrial(browser, i),
      new Promise<TrialResult>((resolve) =>
        setTimeout(
          () =>
            resolve({
              trial: i,
              label: CONFIG.label,
              ok: false,
              error: "trial-timeout",
              firestoreErrors: [],
            }),
          CONFIG.trialTimeoutMs,
        ),
      ),
    ]);
    results.push(trial);
    const firstFirestoreError = trial.firestoreErrors[0];
    const firestoreNote = firstFirestoreError
      ? ` [${trial.firestoreErrors.length} Firestore error(s), e.g. "${firstFirestoreError.text}"]`
      : "";
    console.log(
      (isTrialSuccess(trial)
        ? `Trial ${i}: search=${trial.measures["search-duration"].toFixed(1)}ms, total=${trial.measures["total-flow-duration"].toFixed(1)}ms, heapΔ=${trial.heapDeltaMB.toFixed(1)}MB, heapPeak=${trial.heapPeakMB.toFixed(1)}MB`
        : `Trial ${i}: FAILED (${trial.error})`) + firestoreNote,
    );
  }

  await browser.close();

  const summary = summarize(results);
  fs.writeFileSync(
    CONFIG.outputPath,
    JSON.stringify({ config: CONFIG, summary, results }, null, 2),
  );
  console.log("\n=== Summary ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nFull results: ${CONFIG.outputPath}`);
  process.exit(0);
})();
