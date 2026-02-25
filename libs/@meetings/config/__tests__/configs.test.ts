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

import { AGENCY_CONFIGS, AgencyConfigSchema } from "~@meetings/config";

describe("AgencyConfigSchema", () => {
  test("accepts TTL values >= 7", () => {
    expect(() =>
      AgencyConfigSchema.parse({
        name: "Test",
        stateCode: "US_XX",
        showTranscriptions: false,
        audioTTLDays: 7,
        transcriptTTLDays: 7,
      }),
    ).not.toThrow();
  });

  test("rejects audioTTLDays < 7", () => {
    expect(() =>
      AgencyConfigSchema.parse({
        name: "Test",
        stateCode: "US_XX",
        showTranscriptions: false,
        audioTTLDays: 6,
        transcriptTTLDays: 7,
      }),
    ).toThrow();
  });

  test("rejects transcriptTTLDays < 7", () => {
    expect(() =>
      AgencyConfigSchema.parse({
        name: "Test",
        stateCode: "US_XX",
        showTranscriptions: false,
        audioTTLDays: 7,
        transcriptTTLDays: 1,
      }),
    ).toThrow();
  });
});

describe("AGENCY_CONFIGS", () => {
  test.each(Object.entries(AGENCY_CONFIGS))(
    "%s has audioTTLDays and transcriptTTLDays >= 7",
    (_, config) => {
      expect(config.audioTTLDays).toBeGreaterThanOrEqual(7);
      expect(config.transcriptTTLDays).toBeGreaterThanOrEqual(7);
    },
  );
});
