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

import { parseISO } from "date-fns";
import { z } from "zod";

import { rawEligibleClientFixture } from "../../fixture";
import { clientRecordSchema } from "../../schema";
import { usMoClientMetadataSchema } from "./schema";

// The schema transforms `birthdate` from an ISO string into a `Date`, so the
// raw fixture is typed against the *input* shape.
const validUsMoMetadataInput: z.input<typeof usMoClientMetadataSchema> = {
  stateCode: "US_MO",
  birthdate: "1988-03-14",
  sex: "MALE",
  latestCycleSentences: [
    {
      classificationSubtype: "D",
      classificationType: "Felony",
      description: "Possession of a controlled substance",
      statute: "579.015",
    },
  ],
};

describe("usMoClientMetadataSchema", () => {
  test("parses a valid US_MO metadata fixture and transforms birthdate to Date", () => {
    expect(usMoClientMetadataSchema.parse(validUsMoMetadataInput)).toEqual({
      ...validUsMoMetadataInput,
      birthdate: parseISO("1988-03-14"),
    });
  });

  test("parses a metadata fixture with no sentences", () => {
    const fixture = { ...validUsMoMetadataInput, latestCycleSentences: [] };
    expect(usMoClientMetadataSchema.parse(fixture)).toEqual({
      ...fixture,
      birthdate: parseISO("1988-03-14"),
    });
  });

  test("rejects when stateCode is missing", () => {
    const rest: Partial<typeof validUsMoMetadataInput> = {
      ...validUsMoMetadataInput,
    };
    delete rest.stateCode;
    expect(() => usMoClientMetadataSchema.parse(rest)).toThrow(z.ZodError);
  });

  test("rejects when stateCode is not US_MO", () => {
    expect(() =>
      usMoClientMetadataSchema.parse({
        ...validUsMoMetadataInput,
        stateCode: "US_NE",
      }),
    ).toThrow(z.ZodError);
  });

  test("rejects when birthdate is missing", () => {
    const rest: Partial<typeof validUsMoMetadataInput> = {
      ...validUsMoMetadataInput,
    };
    delete rest.birthdate;
    expect(() => usMoClientMetadataSchema.parse(rest)).toThrow(z.ZodError);
  });

  test("rejects when birthdate is not a parseable ISO date string", () => {
    expect(() =>
      usMoClientMetadataSchema.parse({
        ...validUsMoMetadataInput,
        birthdate: "not-a-date",
      }),
    ).toThrow(z.ZodError);
  });

  test("rejects when sex is the wrong type", () => {
    expect(() =>
      usMoClientMetadataSchema.parse({ ...validUsMoMetadataInput, sex: 42 }),
    ).toThrow(z.ZodError);
  });

  test("rejects when latestCycleSentences is missing", () => {
    const rest: Partial<typeof validUsMoMetadataInput> = {
      ...validUsMoMetadataInput,
    };
    delete rest.latestCycleSentences;
    expect(() => usMoClientMetadataSchema.parse(rest)).toThrow(z.ZodError);
  });

  test("rejects when a sentence is missing a required field", () => {
    expect(() =>
      usMoClientMetadataSchema.parse({
        ...validUsMoMetadataInput,
        latestCycleSentences: [
          {
            classificationSubtype: "D",
            classificationType: "Felony",
            description: "Possession of a controlled substance",
            // statute intentionally omitted
          },
        ],
      }),
    ).toThrow(z.ZodError);
  });
});

describe("usMoClientMetadataSchema integration with clientRecordSchema", () => {
  test("clientRecordSchema accepts a US_MO client with US_MO metadata", () => {
    const record = clientRecordSchema.parse({
      ...rawEligibleClientFixture,
      stateCode: "US_MO",
      metadata: validUsMoMetadataInput,
    });

    expect(record.metadata?.stateCode).toBe("US_MO");
    // Narrow on stateCode to access state-specific fields.
    if (record.metadata?.stateCode === "US_MO") {
      expect(record.metadata.birthdate).toEqual(parseISO("1988-03-14"));
      expect(record.metadata.latestCycleSentences).toHaveLength(1);
    }
  });

  test("clientRecordSchema rejects malformed US_MO metadata", () => {
    expect(() =>
      clientRecordSchema.parse({
        ...rawEligibleClientFixture,
        stateCode: "US_MO",
        metadata: {
          stateCode: "US_MO",
          // Missing required fields below.
        },
      }),
    ).toThrow(z.ZodError);
  });
});
