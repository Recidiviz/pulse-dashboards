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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isFeatureEnabled } from "../app/utils/feature_flags";

const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("isFeatureEnabled", () => {
  it("returns false when no environment variable is set", () => {
    const result = isFeatureEnabled("TEST_FEATURE", "dev");
    expect(result).toBe(false);
  });

  it("returns true when current environment is in enabled environments list", () => {
    process.env["NEXT_PUBLIC_ENVIRONMENT_TEST_FEATURE"] = "dev,staging";

    const result = isFeatureEnabled("TEST_FEATURE", "dev");
    expect(result).toBe(true);
  });

  it("returns false when current environment is not in enabled environments list", () => {
    process.env["NEXT_PUBLIC_ENVIRONMENT_TEST_FEATURE"] = "staging,prod";

    const result = isFeatureEnabled("TEST_FEATURE", "dev");
    expect(result).toBe(false);
  });

  it("handles environments with whitespace", () => {
    process.env["NEXT_PUBLIC_ENVIRONMENT_TEST_FEATURE"] = "dev, staging, prod";

    const result = isFeatureEnabled("TEST_FEATURE", "staging");
    expect(result).toBe(true);
  });

  it("handles empty environment variable", () => {
    process.env["NEXT_PUBLIC_ENVIRONMENT_TEST_FEATURE"] = "";

    const result = isFeatureEnabled("TEST_FEATURE", "dev");
    expect(result).toBe(false);
  });
});
