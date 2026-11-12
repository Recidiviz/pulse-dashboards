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

// `@sparticuz/chromium` (the binary) and `playwright-core` (the driver) must
// agree on the Chromium major, or the deployed function launches a browser the
// driver can't speak to. Sparticuz encodes the Chromium major as its package
// major; playwright-core records the Chromium build it drives in the
// browsers.json it ships. See runtime/package.json and the README version-lock
// note.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const EXACT_SEMVER = /^\d+\.\d+\.\d+$/;

interface PackageManifest {
  version: string;
  dependencies?: Record<string, string>;
}

interface PlaywrightBrowsersManifest {
  browsers: { name: string; browserVersion: string }[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

const runtimeManifest = readJson<PackageManifest>(
  fileURLToPath(new URL("../runtime/package.json", import.meta.url)),
);

function runtimePin(dependency: string): string {
  const pin = runtimeManifest.dependencies?.[dependency];
  if (!pin) throw new Error(`${dependency} missing from runtime/package.json`);
  return pin;
}

function installedVersion(dependency: string): string {
  return readJson<PackageManifest>(
    require.resolve(`${dependency}/package.json`),
  ).version;
}

// Handles both the 3-part package version ("131.0.1") and the 4-part Chromium
// build version playwright-core records ("131.0.6778.33").
function chromiumMajor(version: string): number {
  const match = version.match(/^(\d+)\./);
  if (!match) throw new Error(`expected a dotted version, got "${version}"`);
  return Number(match[1]);
}

/** The Chromium version playwright-core was built to drive. */
function playwrightChromiumVersion(): string {
  const browsersJsonPath = path.join(
    path.dirname(require.resolve("playwright-core/package.json")),
    "browsers.json",
  );
  const chromium = readJson<PlaywrightBrowsersManifest>(
    browsersJsonPath,
  ).browsers.find((browser) => browser.name === "chromium");
  if (!chromium) throw new Error(`no chromium entry in ${browsersJsonPath}`);
  return chromium.browserVersion;
}

describe("runtime/package.json version-lock", () => {
  it.each(["@sparticuz/chromium", "playwright-core"])(
    "pins %s exactly (no range) so the deployed build is reproducible",
    (dependency) => {
      expect(runtimePin(dependency)).toMatch(EXACT_SEMVER);
    },
  );

  // On mismatch: bump both packages together (runtime/package.json AND the root
  // package.json) to a matching Chromium major — see the README version-lock note.
  it.each(["@sparticuz/chromium", "playwright-core"])(
    "pins %s to the workspace-installed version, so these tests exercise what ships",
    (dependency) => {
      expect(runtimePin(dependency)).toBe(installedVersion(dependency));
    },
  );

  it("pins @sparticuz/chromium and playwright-core to the same Chromium major", () => {
    // Sparticuz encodes the Chromium major as its package major; compare it to
    // the Chromium build playwright-core drives (from its browsers.json).
    expect(chromiumMajor(runtimePin("@sparticuz/chromium"))).toBe(
      chromiumMajor(playwrightChromiumVersion()),
    );
  });
});
