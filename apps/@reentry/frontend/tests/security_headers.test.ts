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

import { readFile } from "fs/promises";
import { join } from "path";
import { describe, expect, it } from "vitest";

/**
 * Security Headers Configuration Tests
 *
 * These tests verify that the next.config.js file contains the required
 * security headers configuration. We test the raw config file content to
 * avoid issues with plugin wrapping.
 */

describe("Security Headers Configuration", () => {
  it("should have a headers function in next.config.js", async () => {
    const configPath = join(__dirname, "..", "next.config.js");
    const configContent = await readFile(configPath, "utf-8");

    // Check that the config contains an async headers function
    expect(configContent).toContain("async headers()");
  });

  it("should include Content-Security-Policy header configuration", async () => {
    const configPath = join(__dirname, "..", "next.config.js");
    const configContent = await readFile(configPath, "utf-8");

    expect(configContent).toContain("Content-Security-Policy");
    expect(configContent).toContain("default-src");
    expect(configContent).toContain("script-src");
    expect(configContent).toContain("style-src");
  });

  it("should include X-Frame-Options header set to SAMEORIGIN", async () => {
    const configPath = join(__dirname, "..", "next.config.js");
    const configContent = await readFile(configPath, "utf-8");

    expect(configContent).toContain("X-Frame-Options");
    expect(configContent).toContain("SAMEORIGIN");
  });

  it("should include Strict-Transport-Security (HSTS) header", async () => {
    const configPath = join(__dirname, "..", "next.config.js");
    const configContent = await readFile(configPath, "utf-8");

    expect(configContent).toContain("Strict-Transport-Security");
    expect(configContent).toContain("max-age=31536000");
    expect(configContent).toContain("includeSubDomains");
    expect(configContent).toContain("preload");
  });

  it("should include X-Content-Type-Options header set to nosniff", async () => {
    const configPath = join(__dirname, "..", "next.config.js");
    const configContent = await readFile(configPath, "utf-8");

    expect(configContent).toContain("X-Content-Type-Options");
    expect(configContent).toContain("nosniff");
  });

  it("should configure headers for all routes (/:path*)", async () => {
    const configPath = join(__dirname, "..", "next.config.js");
    const configContent = await readFile(configPath, "utf-8");

    // Verify the catch-all route pattern is configured
    expect(configContent).toContain('source: "/:path*"');
  });

  it("should include all four required security headers", async () => {
    const configPath = join(__dirname, "..", "next.config.js");
    const configContent = await readFile(configPath, "utf-8");

    const requiredHeaders = [
      "Content-Security-Policy",
      "X-Frame-Options",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
    ];

    for (const header of requiredHeaders) {
      expect(configContent).toContain(header);
    }
  });
});
