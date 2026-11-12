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

// Checks that each month's page skeleton is the shape of the page it stands
// in for. For every pair of us-co GeneratedMonths examples, a month and its
// Loading skeleton, it measures the header, the counts row, the grid's
// weekday header and each week row at 1440 by 900, fails when the week
// counts differ or a height differs by more than 2px, and saves the two
// screenshots side by side.
//
// Start the us-co examples server, then run this from the repo root:
//   (cd libs/@parole-board/us-co && npx storybook dev \
//     --config-dir ../common/.examples --ci -p 6612 --preview-only)
//   node libs/@parole-board/common/.examples/skeletonCheck.mjs 6612 <out dir>

import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";

const [port = "6612", outDir = "skeleton-check"] = process.argv.slice(2);
const TOLERANCE_PX = 2;
const VIEWPORT = { width: 1440, height: 900 };
const MONTHS = ["february-2026", "september-2026", "august-2026"];

const storyUrl = (id) =>
  `http://localhost:${port}/iframe.html?args=&globals=&id=${id}&viewMode=story`;

// Runs in the page. The loaded page is MonthHeader, then the month section
// with the counts row and the grid's region; FullCalendar marks the weekday
// header and each week with role="row".
function measurePage() {
  const height = (element) =>
    Math.round(element.getBoundingClientRect().height * 10) / 10;
  const region = document.querySelector(
    '[role="region"][aria-label$=" calendar"]',
  );
  const section = region.parentElement;
  const rows = [...region.querySelectorAll('[role="row"]')].map(height);
  return {
    header: height(section.parentElement.firstElementChild),
    counts: height(section.firstElementChild),
    weekdays: rows[0],
    weeks: rows.slice(1),
  };
}

// Runs in the page. The skeleton is a status around the page: its header,
// then the section with the counts line and a grid of seven weekday cells
// followed by the days, seven to a week.
function measureSkeleton() {
  const height = (element) =>
    Math.round(element.getBoundingClientRect().height * 10) / 10;
  const page = document.querySelector('[role="status"]').lastElementChild;
  const section = page.lastElementChild;
  const cells = [...section.lastElementChild.children];
  const weeks = [];
  for (let start = 7; start < cells.length; start += 7) {
    weeks.push(Math.max(...cells.slice(start, start + 7).map(height)));
  }
  return {
    header: height(page.firstElementChild),
    counts: height(section.firstElementChild),
    weekdays: height(cells[0]),
    weeks,
  };
}

async function capture(browser, id, measure, ready) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(storyUrl(id), { waitUntil: "networkidle" });
  await page.waitForSelector(ready);
  // Lets FullCalendar finish laying out its rows.
  await page.waitForTimeout(500);
  const sizes = await page.evaluate(measure);
  const png = join(outDir, `${id}.png`);
  await page.screenshot({ path: png, fullPage: true });
  await page.close();
  return { sizes, png };
}

async function sideBySide(browser, name, skeletonPng, realPng) {
  const dataUrl = (png) =>
    `data:image/png;base64,${readFileSync(png).toString("base64")}`;
  const page = await browser.newPage({
    viewport: { width: 2 * 1440 + 24, height: 900 },
  });
  await page.setContent(`<body style="margin:0;display:flex;gap:24px;align-items:flex-start;background:#888">
    <img src="${dataUrl(skeletonPng)}" width="1440"><img src="${dataUrl(realPng)}" width="1440"></body>`);
  const out = join(outDir, `${name}-side-by-side.png`);
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
  return out;
}

/** Measures one month and its skeleton, and saves them side by side. */
async function checkMonth(browser, month) {
  const [skeleton, real] = await Promise.all([
    capture(
      browser,
      `us-co-src-generatedmonths--${month}-loading`,
      measureSkeleton,
      '[role="status"]',
    ),
    capture(
      browser,
      `us-co-src-generatedmonths--${month}`,
      measurePage,
      '[role="region"][aria-label$=" calendar"]',
    ),
  ]);
  const a = skeleton.sizes;
  const b = real.sizes;
  const rows = [
    ["header", a.header, b.header],
    ["counts", a.counts, b.counts],
    ["weekdays", a.weekdays, b.weekdays],
    ...b.weeks.map((h, i) => [`week ${i + 1}`, a.weeks[i], h]),
  ];
  const maxDiff = Math.max(...rows.map(([, s, r]) => Math.abs((s ?? 0) - r)));
  const ok = a.weeks.length === b.weeks.length && maxDiff <= TOLERANCE_PX;
  const lines = [
    `${ok ? "PASS" : "FAIL"} ${month}: ${a.weeks.length} skeleton weeks, ${b.weeks.length} weeks; max diff ${Math.round(maxDiff * 10) / 10}px`,
    ...rows.map(
      ([label, s, r]) => `  ${label.padEnd(9)} skeleton ${s}  page ${r}`,
    ),
    `  ${await sideBySide(browser, month, skeleton.png, real.png)}`,
  ];
  return { ok, lines };
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const results = await Promise.all(
  MONTHS.map((month) => checkMonth(browser, month)),
);
await browser.close();
results.forEach(({ lines }) => process.stdout.write(`${lines.join("\n")}\n`));
process.exit(results.every(({ ok }) => ok) ? 0 : 1);
