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

import { workflowsResidentRecordSchema } from "../../workflowsResidentRecordSchema";
import { rawUsTnResidents } from "../fixtures";
import { usTnResidentJiiDataFixture } from "./fixtures";
import { usTnResidentMetadataSchema } from "./schema";

const validInput: z.input<typeof usTnResidentMetadataSchema> = {
  ...usTnResidentJiiDataFixture,
  latestVantageRiskAssessment: {
    assessmentDate: "2026-06-01",
    assessmentType: "STRONG_R2",
    assessmentLevel: "HIGH",
    assessmentLevelRawText: "HV",
  },
  convictionDate: "2024-01-15",
  tnSentences: [
    {
      imposedDate: "2024-01-15",
      offenseDate: "2023-11-01",
      statute: "39-13-210",
      description: "Manslaughter",
      classificationType: "Felony",
      classificationSubtype: "C",
      countyCode: "047",
      isViolent: true,
      isSexOffense: false,
    },
  ],
  iscSentences: [],
  diversionSentences: [],
  phoneNumber: "6155551234",
  address: "123 Main St, Nashville, TN 37201",
};

describe("usTnResidentMetadataSchema warm-handoff fields", () => {
  test("parses all 7 warm-handoff fields, transforming nested dates", () => {
    const parsed = usTnResidentMetadataSchema.parse(validInput);

    expect(parsed.latestVantageRiskAssessment?.assessmentDate).toEqual(
      parseISO("2026-06-01"),
    );
    expect(parsed.latestVantageRiskAssessment?.assessmentType).toBe(
      "STRONG_R2",
    );
    expect(parsed.convictionDate).toEqual(parseISO("2024-01-15"));
    expect(parsed.tnSentences).toHaveLength(1);
    expect(parsed.tnSentences?.[0].imposedDate).toEqual(parseISO("2024-01-15"));
    expect(parsed.tnSentences?.[0].isViolent).toBe(true);
    expect(parsed.iscSentences).toEqual([]);
    expect(parsed.diversionSentences).toEqual([]);
    expect(parsed.phoneNumber).toBe("6155551234");
    expect(parsed.address).toBe("123 Main St, Nashville, TN 37201");
  });

  test("parses when all 7 warm-handoff fields are absent (backward compat)", () => {
    expect(() =>
      usTnResidentMetadataSchema.parse(usTnResidentJiiDataFixture),
    ).not.toThrow();
    const parsed = usTnResidentMetadataSchema.parse(usTnResidentJiiDataFixture);
    expect(parsed.latestVantageRiskAssessment).toBeUndefined();
    expect(parsed.tnSentences).toBeUndefined();
  });

  test("accepts a null latestVantageRiskAssessment (no assessment on file)", () => {
    const fixture = { ...validInput, latestVantageRiskAssessment: null };
    const parsed = usTnResidentMetadataSchema.parse(fixture);
    expect(parsed.latestVantageRiskAssessment).toBeNull();
  });

  test("accepts null sentence arrays (no active sentence of that type — the BQ LEFT JOIN yields NULL, not [], when a person has no active sentences at all)", () => {
    const fixture = {
      ...validInput,
      tnSentences: null,
      iscSentences: null,
      diversionSentences: null,
    };
    const parsed = usTnResidentMetadataSchema.parse(fixture);
    expect(parsed.tnSentences).toBeNull();
    expect(parsed.iscSentences).toBeNull();
    expect(parsed.diversionSentences).toBeNull();
  });

  test("accepts a sentence with every field nullable", () => {
    const fixture: z.input<typeof usTnResidentMetadataSchema> = {
      ...validInput,
      tnSentences: [
        {
          imposedDate: null,
          offenseDate: null,
          statute: null,
          description: null,
          classificationType: null,
          classificationSubtype: null,
          countyCode: null,
          isViolent: null,
          isSexOffense: null,
        },
      ],
    };
    expect(() => usTnResidentMetadataSchema.parse(fixture)).not.toThrow();
  });

  test("accepts a person with TN, ISC, and Diversion sentences simultaneously", () => {
    const sentence = validInput.tnSentences?.[0];
    const fixture = {
      ...validInput,
      tnSentences: [sentence],
      iscSentences: [sentence],
      diversionSentences: [sentence],
    };
    const parsed = usTnResidentMetadataSchema.parse(fixture);
    expect(parsed.tnSentences).toHaveLength(1);
    expect(parsed.iscSentences).toHaveLength(1);
    expect(parsed.diversionSentences).toHaveLength(1);
  });
});

describe("usTnResidentMetadataSchema integration with workflowsResidentRecordSchema", () => {
  test("workflowsResidentRecordSchema parses a US_TN resident with warm-handoff metadata", () => {
    const record = workflowsResidentRecordSchema.parse(rawUsTnResidents[0]);

    expect(record.metadata?.stateCode).toBe("US_TN");
    // Narrow on stateCode to access state-specific fields.
    if (record.metadata?.stateCode === "US_TN") {
      expect(record.metadata.latestVantageRiskAssessment?.assessmentLevel).toBe(
        "HIGH",
      );
      expect(record.metadata.tnSentences).toHaveLength(1);
      expect(record.metadata.phoneNumber).toBe("6155551234");
    }
  });
});
