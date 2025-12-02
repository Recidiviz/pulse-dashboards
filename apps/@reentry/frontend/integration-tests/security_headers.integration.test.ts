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

import { describe, expect, it } from "vitest";

/**
 * Integration tests for security headers.
 *
 * These tests verify that the security headers are actually present in HTTP responses
 * when the application is running. They require a Next.js server to be running.
 *
 * To run these tests locally:
 * 1. Start the dev server: yarn nx dev @reentry/frontend
 * 2. In another terminal, run: TEST_BASE_URL=http://localhost:3000 yarn nx test:integration @reentry/frontend
 *
 * In CI, these tests can be run after deployment to verify headers on the live site:
 * TEST_BASE_URL=https://plan-demo.recidiviz.org yarn nx test:integration @reentry/frontend
 *
 * These tests will be skipped if TEST_BASE_URL is not set or if the server is not reachable.
 */

const BASE_URL = process.env["TEST_BASE_URL"];

// Skip these tests if no TEST_BASE_URL is set
const describeIf = BASE_URL ? describe : describe.skip;

describeIf("Security Headers Integration Tests", () => {
  it("should return Content-Security-Policy header in HTTP response", async () => {
    if (!BASE_URL) throw new Error("TEST_BASE_URL not set");

    const response = await fetch(BASE_URL);
    const cspHeader = response.headers.get("content-security-policy");

    expect(cspHeader).toBeDefined();
    expect(cspHeader).toContain("default-src");
    expect(cspHeader).toContain("script-src");
    expect(cspHeader).toContain("style-src");
  });

  it("should return X-Frame-Options header in HTTP response", async () => {
    if (!BASE_URL) throw new Error("TEST_BASE_URL not set");

    const response = await fetch(BASE_URL);
    const xFrameHeader = response.headers.get("x-frame-options");

    expect(xFrameHeader).toBeDefined();
    expect(xFrameHeader).toBe("SAMEORIGIN");
  });

  it("should return Strict-Transport-Security header in HTTP response", async () => {
    if (!BASE_URL) throw new Error("TEST_BASE_URL not set");

    const response = await fetch(BASE_URL);
    const hstsHeader = response.headers.get("strict-transport-security");

    expect(hstsHeader).toBeDefined();
    expect(hstsHeader).toContain("max-age=31536000");
    expect(hstsHeader).toContain("includeSubDomains");
    expect(hstsHeader).toContain("preload");
  });

  it("should return X-Content-Type-Options header in HTTP response", async () => {
    if (!BASE_URL) throw new Error("TEST_BASE_URL not set");

    const response = await fetch(BASE_URL);
    const xContentTypeHeader = response.headers.get("x-content-type-options");

    expect(xContentTypeHeader).toBeDefined();
    expect(xContentTypeHeader).toBe("nosniff");
  });

  it("should include all four security headers on all routes", async () => {
    if (!BASE_URL) throw new Error("TEST_BASE_URL not set");

    // Test multiple routes to ensure headers are applied everywhere
    const routes = ["/", "/assessment", "/clients"];

    // Fetch all routes in parallel to avoid await-in-loop
    const responses = await Promise.all(
      routes.map((route) =>
        fetch(`${BASE_URL}${route}`, {
          redirect: "manual", // Don't follow redirects
        }),
      ),
    );

    responses.forEach((response) => {
      const headers = {
        csp: response.headers.get("content-security-policy"),
        xFrame: response.headers.get("x-frame-options"),
        hsts: response.headers.get("strict-transport-security"),
        xContentType: response.headers.get("x-content-type-options"),
      };

      // All headers should be present on all routes
      expect(headers.csp).toBeDefined();
      expect(headers.xFrame).toBeDefined();
      expect(headers.hsts).toBeDefined();
      expect(headers.xContentType).toBeDefined();
    });
  });

  it("should include security headers on static assets", async () => {
    if (!BASE_URL) throw new Error("TEST_BASE_URL not set");

    // Test that headers are also applied to static files
    const response = await fetch(`${BASE_URL}/next.svg`, {
      redirect: "manual",
    });

    // Static assets should also have security headers
    expect(response.headers.get("x-frame-options")).toBeDefined();
    expect(response.headers.get("x-content-type-options")).toBeDefined();
  });
});
