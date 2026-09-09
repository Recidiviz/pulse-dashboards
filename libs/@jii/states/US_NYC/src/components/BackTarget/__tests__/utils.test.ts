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

import { ResourceExplorer } from "~@jii/paths";

import { resolveResourceDetailBackTarget, sanitizeBackTarget } from "../utils";

describe("sanitizeBackTarget", () => {
  it("accepts an internal path", () => {
    expect(sanitizeBackTarget("/resources/categories/housing")).toBe(
      "/resources/categories/housing",
    );
  });

  it("rejects an absolute external URL", () => {
    expect(sanitizeBackTarget("https://evil.example.com")).toBeNull();
  });

  it("rejects a protocol-relative URL", () => {
    expect(sanitizeBackTarget("//evil.example.com")).toBeNull();
  });

  it("rejects a javascript: URL", () => {
    // eslint-disable-next-line no-script-url -- this is the exact value being tested and not live code
    expect(sanitizeBackTarget("javascript:alert(1)")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(sanitizeBackTarget(undefined)).toBeNull();
  });
});

describe("resolveResourceDetailBackTarget", () => {
  const residentParams = {
    stateSlug: "new-york-city",
    personPseudoId: "abc123",
  };
  const category = "education";
  const categoryResultsPath =
    "/new-york-city/abc123/resources/categories/education";

  function buildDetailSearchParams({
    resourceId,
    backTarget,
    visitedResourceIds,
  }: {
    resourceId: number;
    backTarget?: string;
    visitedResourceIds?: string;
  }): URLSearchParams {
    const path = ResourceExplorer.CategoryResults.Detail.buildPath(
      { category, resourceId },
      { backTarget, visitedResourceIds },
    );
    return new URL(`http://opportunities.app${path}`).searchParams;
  }

  it("falls back to categoryResultsPath when there's no backTarget or visitedResourceIds", () => {
    const currentPageResourceId = 102;
    const { backPath } = resolveResourceDetailBackTarget(
      buildDetailSearchParams({ resourceId: currentPageResourceId }),
      {
        residentParams,
        category,
        resourceId: currentPageResourceId,
        categoryResultsPath,
      },
    );

    expect(backPath).toBe(categoryResultsPath);
  });

  it("uses backTarget as the back target when present", () => {
    const currentPageResourceId = 102;
    const filteredListPath = `${categoryResultsPath}?subcategories=job-training`;
    const { backPath } = resolveResourceDetailBackTarget(
      buildDetailSearchParams({
        resourceId: currentPageResourceId,
        backTarget: filteredListPath,
      }),
      {
        residentParams,
        category,
        resourceId: currentPageResourceId,
        categoryResultsPath,
      },
    );

    expect(backPath).toBe(filteredListPath);
  });

  it("rejects an unsafe backTarget and falls back to categoryResultsPath", () => {
    const currentPageResourceId = 102;
    const { backPath } = resolveResourceDetailBackTarget(
      buildDetailSearchParams({
        resourceId: currentPageResourceId,
        backTarget: "https://evil.example.com",
      }),
      {
        residentParams,
        category,
        resourceId: currentPageResourceId,
        categoryResultsPath,
      },
    );

    expect(backPath).toBe(categoryResultsPath);
  });

  it("pops the last visitedResourceIds entry as the back target, preserving backTarget and the rest of the chain", () => {
    const currentPageResourceId = 103;
    const filteredListPath = `${categoryResultsPath}?subcategories=job-training`;
    // Visit order so far: 101 -> 102 -> 103 (current page)
    const { backPath } = resolveResourceDetailBackTarget(
      buildDetailSearchParams({
        resourceId: currentPageResourceId,
        backTarget: filteredListPath,
        visitedResourceIds: "101,102",
      }),
      {
        residentParams,
        category,
        resourceId: currentPageResourceId,
        categoryResultsPath,
      },
    );

    // Lands back on 102, with 101 left as the remaining chain to retrace next
    expect(backPath).toBe(
      `/new-york-city/abc123/resources/categories/education/102?backTarget=${encodeURIComponent(filteredListPath)}&visitedResourceIds=101`,
    );
  });

  it("omits visitedResourceIds from the back target once the chain is fully popped", () => {
    const currentPageResourceId = 102;
    const filteredListPath = `${categoryResultsPath}?subcategories=job-training`;
    // Visit order so far: 101 -> 102 (current page)
    const { backPath } = resolveResourceDetailBackTarget(
      buildDetailSearchParams({
        resourceId: currentPageResourceId,
        backTarget: filteredListPath,
        visitedResourceIds: "101",
      }),
      {
        residentParams,
        category,
        resourceId: currentPageResourceId,
        categoryResultsPath,
      },
    );

    // Lands back on 101, with no visitedResourceIds left to retrace
    expect(backPath).toBe(
      `/new-york-city/abc123/resources/categories/education/101?backTarget=${encodeURIComponent(filteredListPath)}`,
    );
  });

  it("similarResourcePath appends the current resourceId to visitedResourceIds, preserving backTarget", () => {
    const currentPageResourceId = 102;
    const filteredListPath = `${categoryResultsPath}?subcategories=job-training`;
    // Visit order so far: 101 -> 102 (current page)
    const { similarResourcePath } = resolveResourceDetailBackTarget(
      buildDetailSearchParams({
        resourceId: currentPageResourceId,
        backTarget: filteredListPath,
        visitedResourceIds: "101",
      }),
      {
        residentParams,
        category,
        resourceId: currentPageResourceId,
        categoryResultsPath,
      },
    );

    // Clicking a similar resource (103) extends the chain to 101 -> 102, so 103's Back retraces both.
    expect(similarResourcePath(103)).toBe(
      `/new-york-city/abc123/resources/categories/education/103?backTarget=${encodeURIComponent(filteredListPath)}&visitedResourceIds=101%2C102`,
    );
  });

  it("similarResourcePath starts a new visitedResourceIds from a page with no chain of its own", () => {
    const currentPageResourceId = 101;
    // Reached directly (no chain yet)
    const { similarResourcePath } = resolveResourceDetailBackTarget(
      buildDetailSearchParams({ resourceId: currentPageResourceId }),
      {
        residentParams,
        category,
        resourceId: currentPageResourceId,
        categoryResultsPath,
      },
    );

    // Clicking a similar resource (102) starts a fresh chain containing just 101.
    expect(similarResourcePath(102)).toBe(
      "/new-york-city/abc123/resources/categories/education/102?visitedResourceIds=101",
    );
  });
});
