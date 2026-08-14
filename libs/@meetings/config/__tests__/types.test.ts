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

import { AgencyConfigFileSchema } from "~@meetings/config/types";

describe("AgencyConfigFileSchema", () => {
  describe("TTL minimum validation", () => {
    test.each(["audioTTLDays", "transcriptTTLDays"] as const)(
      "%s rejects values below 7",
      (field) => {
        expect(() =>
          AgencyConfigFileSchema.parse({
            name: "Test",
            stateCode: "US_XX",
            [field]: 6,
          }),
        ).toThrow();
      },
    );

    test.each(["audioTTLDays", "transcriptTTLDays"] as const)(
      "%s accepts null (no expiry)",
      (field) => {
        expect(() =>
          AgencyConfigFileSchema.parse({
            name: "Test",
            stateCode: "US_XX",
            [field]: null,
          }),
        ).not.toThrow();
      },
    );

    test.each(["audioTTLDays", "transcriptTTLDays"] as const)(
      "%s accepts 7",
      (field) => {
        expect(() =>
          AgencyConfigFileSchema.parse({
            name: "Test",
            stateCode: "US_XX",
            [field]: 7,
          }),
        ).not.toThrow();
      },
    );
  });
});
