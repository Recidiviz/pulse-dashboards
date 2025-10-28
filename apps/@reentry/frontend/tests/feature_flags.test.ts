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
  it("returns false when feature flag is not set", () => {
    const result = isFeatureEnabled("TEST_NOT_SET_FLAG", "dev");
    expect(result).toBe(false);
  });

  it("returns true when current environment is in enabled environments list", () => {
    let result = isFeatureEnabled("TEST_FEATURE_DEV_STAGING", "dev");
    expect(result).toBe(true);

    result = isFeatureEnabled("TEST_FEATURE_DEV_STAGING", "staging");
    expect(result).toBe(true);
  });

  it("returns false when current environment is not in enabled environments list", () => {
    const result = isFeatureEnabled("TEST_FEATURE_DEV", "prod");
    expect(result).toBe(false);
  });
});
