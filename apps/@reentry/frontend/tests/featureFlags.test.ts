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

import { isFeatureEnabled as isFeatureEnabledRuntime } from "../app/utils/featureFlagsRuntime";
import { isFeatureEnabled as isFeatureEnabledBuildtime } from "../config/featureFlagsBuildtime";

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
    const result = isFeatureEnabledRuntime("TEST_NOT_SET_FLAG", "dev");
    expect(result).toBe(false);
  });

  it("returns true when current environment is in enabled environments list", () => {
    let result = isFeatureEnabledRuntime("TEST_FEATURE_DEV_STAGING", "dev");
    expect(result).toBe(true);

    result = isFeatureEnabledRuntime("TEST_FEATURE_DEV_STAGING", "staging");
    expect(result).toBe(true);
  });

  it("returns false when current environment is not in enabled environments list", () => {
    const result = isFeatureEnabledRuntime("TEST_FEATURE_DEV", "prod");
    expect(result).toBe(false);
  });

  it("INTAKE_RESET is enabled in runtime for development, dev, demo and staging", () => {
    expect(isFeatureEnabledRuntime("INTAKE_RESET", "development")).toBe(true);
    expect(isFeatureEnabledRuntime("INTAKE_RESET", "dev")).toBe(true);
    expect(isFeatureEnabledRuntime("INTAKE_RESET", "demo")).toBe(true);
    expect(isFeatureEnabledRuntime("INTAKE_RESET", "staging")).toBe(true);
  });

  it("INTAKE_RESET is disabled in runtime for production", () => {
    expect(isFeatureEnabledRuntime("INTAKE_RESET", "production")).toBe(false);
    expect(isFeatureEnabledRuntime("INTAKE_RESET", "prod")).toBe(false);
  });

  describe("build-time flags", () => {
    it("ENABLE_SOURCE_MAPS is enabled in dev, demo and staging", () => {
      expect(isFeatureEnabledBuildtime("ENABLE_SOURCE_MAPS", "dev")).toBe(true);
      expect(isFeatureEnabledBuildtime("ENABLE_SOURCE_MAPS", "demo")).toBe(
        true,
      );
      expect(isFeatureEnabledBuildtime("ENABLE_SOURCE_MAPS", "staging")).toBe(
        true,
      );
    });

    it("ENABLE_SOURCE_MAPS is disabled in production", () => {
      expect(
        isFeatureEnabledBuildtime("ENABLE_SOURCE_MAPS", "production"),
      ).toBe(false);
      expect(isFeatureEnabledBuildtime("ENABLE_SOURCE_MAPS", "prod")).toBe(
        false,
      );
    });
  });
});
