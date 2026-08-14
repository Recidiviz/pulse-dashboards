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

import { describe, expect, test } from "vitest";
import { parse } from "yaml";

import { newAgencyConfigYamlTemplate } from "~@meetings/config/newConfigTemplate";
import { AgencyConfigFileSchema } from "~@meetings/config/types";

describe("newAgencyConfigYamlTemplate", () => {
  test("includes only the required fields, not optional ones", () => {
    const template = newAgencyConfigYamlTemplate();
    const parsed = parse(template);
    expect(Object.keys(parsed)).toEqual(["name", "stateCode", "version"]);
  });

  test("leaves name blank", () => {
    const parsed = parse(newAgencyConfigYamlTemplate());
    expect(parsed.name).toBeNull();
  });

  test("fills version with the schema's default value", () => {
    const parsed = parse(newAgencyConfigYamlTemplate());
    expect(parsed.version).toBe(1);
  });

  test("leaves stateCode blank when none is given", () => {
    const parsed = parse(newAgencyConfigYamlTemplate());
    expect(parsed.stateCode).toBeNull();
  });

  test("fills stateCode with the given value", () => {
    const parsed = parse(newAgencyConfigYamlTemplate("US_CA"));
    expect(parsed.stateCode).toBe("US_CA");
  });

  test("output parses as valid AgencyConfigFileSchema once name/stateCode are filled in", () => {
    const template = newAgencyConfigYamlTemplate("US_CA");
    const parsed = parse(template);
    parsed.name = "Test Agency";

    expect(() => AgencyConfigFileSchema.parse(parsed)).not.toThrow();
  });
});
