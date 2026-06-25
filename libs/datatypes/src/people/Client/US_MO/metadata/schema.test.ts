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
import { usMoClientMetadataFixture } from "./fixture";
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
            statute: "579.015",
            // description intentionally omitted
          },
        ],
      }),
    ).toThrow(z.ZodError);
  });

  test("accepts a sentence with a null statute (e.g. out-of-state offense)", () => {
    const fixture = {
      ...validUsMoMetadataInput,
      latestCycleSentences: [
        {
          classificationSubtype: "D",
          classificationType: "Felony",
          description: "Out-of-state offense",
          statute: null,
        },
      ],
    };
    expect(usMoClientMetadataSchema.parse(fixture)).toEqual({
      ...fixture,
      birthdate: parseISO("1988-03-14"),
    });
  });
});

describe("usMoClientMetadataSchema ORAS assessment and case plan", () => {
  test("parses the reusable fixture, transforming assessmentDate to a Date", () => {
    const parsed = usMoClientMetadataSchema.parse(usMoClientMetadataFixture);

    expect(parsed.orasAssessment?.assessmentDate).toEqual(
      parseISO("2026-04-10"),
    );
    expect(parsed.orasAssessment?.lastUpdated).toEqual(parseISO("2026-06-01"));
    expect(parsed.casePlan).toHaveLength(2);
    expect(parsed.casePlan?.[0].goal).toBe("RS02A-Maintain Pro-Social Housing");
    expect(parsed.casePlan?.[0].objectivesAndTechniques).toHaveLength(3);
  });

  test("accepts a null orasAssessment", () => {
    const fixture = { ...usMoClientMetadataFixture, orasAssessment: null };
    expect(() => usMoClientMetadataSchema.parse(fixture)).not.toThrow();
  });

  test("accepts an orasAssessment without a lastUpdated date", () => {
    const fixture: z.input<typeof usMoClientMetadataSchema> = {
      ...usMoClientMetadataFixture,
      orasAssessment: {
        assessmentScore: 23,
        assessmentType: "ORAS_COMMUNITY_SUPERVISION",
        assessmentAdministeredBy: "MaryAnn Harper",
        assessmentDate: "2026-04-10",
      },
    };
    const parsed = usMoClientMetadataSchema.parse(fixture);
    expect(parsed.orasAssessment?.lastUpdated).toBeUndefined();
  });

  test("parses when both orasAssessment and casePlan are missing (backward compat)", () => {
    expect(usMoClientMetadataSchema.parse(validUsMoMetadataInput)).toEqual({
      ...validUsMoMetadataInput,
      birthdate: parseISO("1988-03-14"),
    });
  });

  test("accepts an empty casePlan array", () => {
    const fixture = { ...usMoClientMetadataFixture, casePlan: [] };
    const parsed = usMoClientMetadataSchema.parse(fixture);
    expect(parsed.casePlan).toEqual([]);
  });

  test("accepts a null objectiveEndDate", () => {
    const parsed = usMoClientMetadataSchema.parse(usMoClientMetadataFixture);
    expect(
      parsed.casePlan?.[0].objectivesAndTechniques[0].objectiveEndDate,
    ).toBeNull();
  });

  test("accepts a null goal", () => {
    const fixture = {
      ...usMoClientMetadataFixture,
      casePlan: [{ goal: null, objectivesAndTechniques: [] }],
    };
    const parsed = usMoClientMetadataSchema.parse(fixture);
    expect(parsed.casePlan?.[0].goal).toBeNull();
  });

  test("strips wrapping double quotes from goal, objective, and techniques", () => {
    const fixture: z.input<typeof usMoClientMetadataSchema> = {
      ...usMoClientMetadataFixture,
      casePlan: [
        {
          goal: '"RS02A-Maintain Pro-Social Housing"',
          objectivesAndTechniques: [
            {
              objective: '"RS01.001-Research viable/ stable home plan options"',
              objectiveEndDate: null,
              techniques: ['"IC01-Verbal Affirmation"', "SV02-No quotes here"],
            },
          ],
        },
      ],
    };
    const parsed = usMoClientMetadataSchema.parse(fixture);
    const goal = parsed.casePlan?.[0];
    expect(goal?.goal).toBe("RS02A-Maintain Pro-Social Housing");
    expect(goal?.objectivesAndTechniques[0].objective).toBe(
      "RS01.001-Research viable/ stable home plan options",
    );
    expect(goal?.objectivesAndTechniques[0].techniques).toEqual([
      "IC01-Verbal Affirmation",
      "SV02-No quotes here",
    ]);
  });

  test("transforms a non-null objectiveEndDate to a Date", () => {
    const fixture: z.input<typeof usMoClientMetadataSchema> = {
      ...usMoClientMetadataFixture,
      casePlan: [
        {
          goal: "RS02A-Maintain Pro-Social Housing",
          objectivesAndTechniques: [
            {
              objective: "Some objective",
              objectiveEndDate: "2026-05-15",
              techniques: [],
            },
          ],
        },
      ],
    };
    const parsed = usMoClientMetadataSchema.parse(fixture);
    expect(
      parsed.casePlan?.[0].objectivesAndTechniques[0].objectiveEndDate,
    ).toEqual(parseISO("2026-05-15"));
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
