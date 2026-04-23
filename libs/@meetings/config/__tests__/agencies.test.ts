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
 * Validates every agency YAML config against the Zod schema.
 * This test runs in CI and will fail if any YAML is malformed or
 * violates schema constraints (invalid types, missing required fields, etc.).
 */

import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

import { loadAgencyConfig } from "~@meetings/config/loader";
import {
  AgencyConfigFileSchema,
  AgencyConfigSchema,
} from "~@meetings/config/types";

const YAML_DIR = path.join(__dirname, "../src/yaml");

const agencyFiles = fs
  .readdirSync(YAML_DIR)
  .filter((f) => f.endsWith(".yaml") && f !== "base.yaml");

const stateCodes = agencyFiles.map((f) =>
  path.basename(f, ".yaml").toUpperCase(),
);

describe("agency YAML files", () => {
  test.each(agencyFiles)("%s satisfies AgencyConfigFileSchema", (file) => {
    const content = fs.readFileSync(path.join(YAML_DIR, file), "utf8");
    const raw = parse(content);
    expect(() => AgencyConfigFileSchema.parse(raw)).not.toThrow();
  });
});

describe("merged agency configs", () => {
  test.each(stateCodes)("%s resolves to a valid AgencyConfig", (stateCode) => {
    const config = loadAgencyConfig(stateCode);
    expect(() => AgencyConfigSchema.parse(config)).not.toThrow();
  });
});
